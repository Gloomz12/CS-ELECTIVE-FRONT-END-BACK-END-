<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';
$database = new Connection();
$conn = $database->connect();

$data = json_decode(file_get_contents("php://input"));

if (
    !empty($data->property_id) &&
    !empty($data->tenant_id) &&
    !empty($data->lease_term_months) &&
    !empty($data->message)
) {
    try {
        $query = "INSERT INTO inquiries (property_id, tenant_id, lease_term_months, tenant_name, property_name, message, status) 
                  VALUES (:property_id, :tenant_id, :lease_term_months, :tenant_name, :property_name, :message, 'pending')";

        /** @var PDO $conn */
        $stmt = $conn->prepare($query);

        $stmt->bindParam(':property_id', $data->property_id);
        $stmt->bindParam(':tenant_id', $data->tenant_id);
        $stmt->bindParam(':lease_term_months', $data->lease_term_months);
        $stmt->bindParam(':tenant_name', $data->tenant_name);
        $stmt->bindParam(':property_name', $data->property_name);
        $stmt->bindParam(':message', $data->message);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Inquiry sent successfully."]);
        } else {
            echo json_encode(["success" => false, "message" => "Unable to send inquiry."]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "message" => "Incomplete data provided."]);
}
