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

$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['user_id'] ?? null;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "User ID required"]);
    exit;
}

try {
    $stmt = $conn->prepare("
        UPDATE users 
        SET 
            username = ?, 
            full_name = ?, 
            phone_number = ?, 
            date_of_birth = ?, 
            address = ?, 
            country = ?, 
            gender = ?, 
            payment_methods = ? 
        WHERE id = ?
    ");

    $paymentMethodsJson = json_encode($data['payment_methods']);

    $stmt->execute([
        $data['username'],
        $data['full_name'],
        $data['phone_number'],
        $data['date_of_birth'],
        $data['address'],
        $data['country'],
        $data['gender'],
        $paymentMethodsJson,
        $userId
    ]);

    echo json_encode(["success" => true, "message" => "Settings updated successfully"]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>