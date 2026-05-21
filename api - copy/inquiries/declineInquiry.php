<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $query = "DELETE FROM inquiries WHERE id = :id";
    $stmt = $conn->prepare($query);

    if ($stmt->execute([':id' => $data->id])) {
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Inquiry declined successfully."]);
    } else {
        http_response_code(503);
        echo json_encode(["success" => false, "message" => "Unable to decline inquiry."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Inquiry ID is required."]);
}