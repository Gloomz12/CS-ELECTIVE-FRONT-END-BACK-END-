<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

require_once '../config/db.php';

$data = json_decode(file_get_contents("php://input"), true);

$tenantId   = $data['tenant_id'] ?? null;
$ownerId    = $data['owner_id'] ?? null;
$rentingId  = $data['renting_id'] ?? null;
$amount     = (float)($data['amount'] ?? 0);
$monthsPaid = (int)($data['months_paid'] ?? 0);

if (!$tenantId || !$ownerId || !$rentingId || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid payment data. Missing required fields."]);
    exit;
}

try {
    $connection = new Connection();
    /** @var PDO $db */ 
    $db = $connection->connect();

    if (!$db) {
        throw new Exception("Database connection failed");
    }

    $db->beginTransaction();

    $stmt = $db->prepare("SELECT balance FROM users WHERE id = ?");
    $stmt->execute([$tenantId]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tenant || (float)$tenant['balance'] < $amount) {
        throw new Exception("Insufficient balance");
    }

    $deduct = $db->prepare("UPDATE users SET balance = balance - ? WHERE id = ?");
    $deduct->execute([$amount, $tenantId]);

    $add = $db->prepare("UPDATE users SET balance = balance + ? WHERE id = ?");
    $add->execute([$amount, $ownerId]);

    $updateRenting = $db->prepare("
        UPDATE rentings 
        SET total_paid = total_paid + ?
        WHERE id = ?
    ");
    $updateRenting->execute([$amount, $rentingId]);

    $db->commit();
    echo json_encode(["success" => true, "message" => "Payment successful. Balance transferred to owner."]);

} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}