<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
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

    $userId = $_GET['userId'] ?? null;

    if (!$userId) {
        echo json_encode(["success" => false, "message" => "User ID is required"]);
        exit;
    }

    $query = "
        SELECT 
            t.id, 
            t.amount, 
            t.transaction_type, 
            t.payment_method, 
            t.status, 
            t.reference_number, 
            t.created_at,
            t.renting_id,
            t.property_id,
            u.full_name AS tenant_name,
            p.name AS property_name,
            r.unit_occupancy,
            r.monthly_rate
        FROM transactions t
        LEFT JOIN users u ON t.tenant_id = u.id
        LEFT JOIN rentings r ON t.renting_id = r.id
        LEFT JOIN properties p ON t.property_id = p.id
        WHERE t.tenant_id = :tid OR t.owner_id = :oid
        ORDER BY t.created_at DESC
    ";

    $stmt = $conn->prepare($query);
    $stmt->bindParam(':tid', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':oid', $userId, PDO::PARAM_INT);
    $stmt->execute();
    
    $transactions = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        "success" => true,
        "data" => $transactions
    ]);

} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database Error: " . $e->getMessage()]);
}
?>