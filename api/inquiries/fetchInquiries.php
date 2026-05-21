<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once '../config/db.php';
$database = new Connection();
/** @var PDO $conn */
$conn = $database->connect();

try {
    $query = "SELECT id, property_id, tenant_id, lease_term_months, tenant_name, property_name, created_at, message, status FROM inquiries";

    $stmt = $conn->prepare($query);
    $stmt->execute();

    $inquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($inquiries);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => $e->getMessage()]);
}
