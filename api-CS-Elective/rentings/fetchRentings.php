<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db.php';

try {
    $database = new Connection();
    /** @var PDO $conn */
    $conn = $database->connect();

    $data = json_decode(file_get_contents("php://input"), true);
    $userId = $data['user_id'] ?? null;

    if ($userId) {
        $stmt = $conn->prepare("
        SELECT 
           r.*, 
            p.image_url,
          p.owner_id -- Add this line
        FROM rentings r
        LEFT JOIN properties p ON r.property_id = p.id
        WHERE r.tenant_id = ?
        ORDER BY r.created_at DESC
");
        $stmt->execute([$userId]);
        $rentings = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "data" => $rentings]);
    } else {
        echo json_encode(["success" => false, "message" => "User ID required"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
