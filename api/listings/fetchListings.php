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

try {
    $stmt = $conn->prepare("SELECT properties.id, properties.owner_id, properties.name, properties.location_address,  properties.price_monthly, properties.type,  properties.status, properties.image_url, properties.map_image_url, properties.created_at, properties.amenities, users.username, users.profile_picture FROM properties INNER JOIN users ON properties.owner_id = users.id");
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
