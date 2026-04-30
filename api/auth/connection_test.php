<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config/db.php';

$database = new Connection();

/** @var PDO $conn */
$conn = $database->connect();

if ($conn) {
    echo json_encode([
        "success" => true,
        "status" => "connected",
        "message" => "React successfully connected to the XAMPP Database via PDO!",
        "database_status" => "Connected",
        "timestamp" => date("Y-m-d H:i:s")
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "success" => false, 
        "message" => "Database connection returned null."
    ]);
}
?>