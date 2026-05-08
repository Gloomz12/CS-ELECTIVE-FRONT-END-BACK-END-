<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once '../config/db.php';
$database = new Connection();
/** @var PDO $conn */
$conn = $database->connect();

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->inquiry_id) && 
    !empty($data->unit_occupancy)
) {
    try {
        $conn->beginTransaction();

        $queryInquiryDetails = "SELECT property_id, tenant_id, lease_term_months FROM inquiries WHERE id = :inq_id LIMIT 1";
        $stmtInqDetails = $conn->prepare($queryInquiryDetails);
        $stmtInqDetails->execute([':inq_id' => $data->inquiry_id]);
        $inquiry = $stmtInqDetails->fetch(PDO::FETCH_ASSOC);

        if (!$inquiry) {
            throw new Exception("Inquiry not found.");
        }

        $queryPropertyDetails = "SELECT name, price_monthly FROM properties WHERE id = :prop_id LIMIT 1";
        $stmtPropDetails = $conn->prepare($queryPropertyDetails);
        $stmtPropDetails->execute([':prop_id' => $inquiry['property_id']]);
        $property = $stmtPropDetails->fetch(PDO::FETCH_ASSOC);

        if (!$property) {
            throw new Exception("Associated property not found.");
        }

        $monthly_rate = floatval($property['price_monthly']);
        $lease_term = intval($inquiry['lease_term_months']);
        $total_due = $monthly_rate * $lease_term;

        $queryRenting = "INSERT INTO rentings (
            property_id, tenant_id, property_name, monthly_rate, 
            lease_term, total_due, status, start_date, unit_occupancy,
            months_pending, pending_payment, total_paid
        ) VALUES (
            :pid, :tid, :pname, :rate, :term, :total_due, 'Active', CURDATE(), :occupancy, 0, 0, 0
        )";

        $stmtRenting = $conn->prepare($queryRenting);
        $stmtRenting->execute([
            ':pid'       => $inquiry['property_id'],
            ':tid'       => $inquiry['tenant_id'],
            ':pname'     => $property['name'],
            ':rate'      => $monthly_rate,
            ':term'      => $lease_term,
            ':total_due' => $total_due,
            ':occupancy' => $data->unit_occupancy
        ]);

        $queryDeleteInquiry = "DELETE FROM inquiries WHERE id = :inq_id";
        $stmtDelInq = $conn->prepare($queryDeleteInquiry);
        $stmtDelInq->execute([':inq_id' => $data->inquiry_id]);

        $conn->commit();

        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Inquiry accepted. Tenant is now active."]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Error: " . $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Incomplete data for acceptance. Make sure unit occupancy is provided."]);
}