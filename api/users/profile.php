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

$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['user_id'] ?? null;

if ($userId) {
    try {
        $stmt = $conn->prepare("SELECT id, username, email, balance, created_at FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            echo json_encode(["success" => true, "version" => "test_1", "data" => $user]);
        } else {
            echo json_encode(["success" => false, "message" => "User not found"]);
        }
    } catch (PDOException $e) {
        echo json_encode(["success" => false, "message" => "Database error"]);
    }
} else {
    echo json_encode(["success" => false, "message" => "User ID required"]);
}
