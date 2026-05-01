<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';
$database = new Connection();

/** @var PDO $conn */
$conn = $database->connect();

try {
    $stmt = $conn->prepare("SELECT id, name, location_address, price_monthly, type, status, main_image_url FROM properties");
    $stmt->execute();
    $properties = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if ($properties) {
        echo json_encode(["success" => true, "data" => $properties]);
    } else {
        echo json_encode(["success" => false, "message" => "No properties found"]);
    }
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}