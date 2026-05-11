<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db.php';

try {
    $database = new Connection();
    /** @var PDO $conn */
    $conn = $database->connect();

    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->tenant_id) || empty($data->tenant_id)) {
        echo json_encode(["success" => false, "message" => "Tenant ID is missing"]);
        exit;
    }

    $tenant_id = $data->tenant_id;

    $stmt = $conn->prepare("DELETE FROM rentings WHERE id = :tenant_id");
    $stmt->bindParam(':tenant_id', $tenant_id);

    if ($stmt->execute()) {
        ob_clean();
        echo json_encode(["success" => true, "message" => "Tenant record removed successfully."]);
    } else {
        ob_clean();
        echo json_encode(["success" => false, "message" => "Failed to execute delete query."]);
    }
} catch (PDOException $e) {
    ob_clean();
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}

ob_end_flush();
