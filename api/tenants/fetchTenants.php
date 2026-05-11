<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

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
    $propertyId = $data['property_id'] ?? null;

    if ($propertyId) {
        $stmt = $conn->prepare("
            SELECT 
                r.*, 
                u.full_name as tenant_name
            FROM rentings r
            LEFT JOIN users u ON r.tenant_id = u.id
            WHERE r.property_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$propertyId]);
        $tenants = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(["success" => true, "data" => $tenants]);
    } else {
        echo json_encode(["success" => false, "message" => "Property ID required"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}