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

if (!empty($data->inquiry_id) && !empty($data->unit_occupancy)) {
    try {
        $conn->beginTransaction();

        $stmtInq = $conn->prepare("SELECT property_id, tenant_id, lease_term_months FROM inquiries WHERE id = ?");
        $stmtInq->execute([$data->inquiry_id]);
        $inquiry = $stmtInq->fetch(PDO::FETCH_ASSOC);

        if (!$inquiry) throw new Exception("Inquiry not found.");

        $stmtProp = $conn->prepare("SELECT name, price_monthly, owner_id FROM properties WHERE id = ?");
        $stmtProp->execute([$inquiry['property_id']]);
        $property = $stmtProp->fetch(PDO::FETCH_ASSOC);

        if (!$property) throw new Exception("Property not found.");

        $monthly_rate = floatval($property['price_monthly']);
        $owner_id = $property['owner_id'];
        $tenant_id = $inquiry['tenant_id'];

        $stmtBal = $conn->prepare("SELECT balance FROM users WHERE id = ? FOR UPDATE");
        $stmtBal->execute([$tenant_id]);
        $tenant = $stmtBal->fetch(PDO::FETCH_ASSOC);

        if (!$tenant || floatval($tenant['balance']) < $monthly_rate) {
            throw new Exception("Tenant has insufficient balance (₱" . number_format($monthly_rate, 2) . " required).");
        }

        $deduct = $conn->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
        $deduct->execute([$monthly_rate, $tenant_id]);

        $add = $conn->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
        $add->execute([$monthly_rate, $owner_id]);

        $total_term = intval($inquiry['lease_term_months']);
        $total_due = $monthly_rate * $total_term;

        $queryRenting = "INSERT INTO rentings (
            property_id, tenant_id, property_name, monthly_rate, 
            lease_term, total_due, status, start_date, unit_occupancy,
            months_pending, pending_payment, total_paid
        ) VALUES (?, ?, ?, ?, ?, ?, 'Active', CURDATE(), ?, ?, ?, ?)";

        $stmtRenting = $conn->prepare($queryRenting);
        $stmtRenting->execute([
            $inquiry['property_id'],
            $tenant_id,
            $property['name'],
            $monthly_rate,
            $total_term,
            $total_due,
            $data->unit_occupancy,
            $total_term - 1,             
            $total_due - $monthly_rate,   
            $monthly_rate                 
        ]);
        
        $stmtDel = $conn->prepare("DELETE FROM inquiries WHERE id = ?");
        $stmtDel->execute([$data->inquiry_id]);

        $conn->commit();
        echo json_encode(["success" => true, "message" => "Payment successful. Tenant is now active."]);

    } catch (Exception $e) {
        if ($conn->inTransaction()) $conn->rollBack();
        http_response_code(400);
        echo json_encode(["success" => false, "message" => $e->getMessage()]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing required fields."]);
}