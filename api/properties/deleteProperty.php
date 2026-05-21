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

/** @var PDO $conn */
$conn = $database->connect();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->property_id) || empty($data->property_id)) {
    echo json_encode(["success" => false, "message" => "Property ID is required"]);
    exit;
}

$property_id = $data->property_id;

try {
    $stmtCheck = $conn->prepare("SELECT COUNT(*) as unpaid_count FROM rentings WHERE property_id = :property_id AND total_paid < total_due");
    $stmtCheck->bindParam(':property_id', $property_id);
    $stmtCheck->execute();
    $row = $stmtCheck->fetch(PDO::FETCH_ASSOC);

    if ($row['unpaid_count'] > 0) {
        echo json_encode(["success" => false, "message" => "Cannot delete property. There are " . $row['unpaid_count'] . " tenant(s) with pending balances."]);
        exit;
    }

    $stmtDeleteTenants = $conn->prepare("DELETE FROM rentings WHERE property_id = :property_id");
    $stmtDeleteTenants->bindParam(':property_id', $property_id);
    $stmtDeleteTenants->execute();

    $stmtDeleteProp = $conn->prepare("DELETE FROM properties WHERE id = :property_id");
    $stmtDeleteProp->bindParam(':property_id', $property_id);

    if ($stmtDeleteProp->execute()) {
        echo json_encode(["success" => true, "message" => "Property and associated records deleted successfully."]);
    } else {
        echo json_encode(["success" => false, "message" => "Failed to delete property."]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
