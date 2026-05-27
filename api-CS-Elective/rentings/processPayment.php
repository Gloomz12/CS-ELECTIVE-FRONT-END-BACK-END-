<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

require_once '../config/db.php';
$data = json_decode(file_get_contents("php://input"), true);

$tenantId       = $data['tenant_id'] ?? null;
$ownerId        = $data['owner_id'] ?? null;
$rentingId      = $data['renting_id'] ?? null;
$propertyId     = $data['property_id'] ?? null; 
$unitOccupancy  = $data['unit_occupancy'] ?? null; 
$amount         = (float)($data['amount'] ?? 0);
$monthsPaid     = (int)($data['months_paid'] ?? 0);
$monthsPending  = $data['months_pending'] ?? 0;
$status         = $data['status'] ?? null;
$pendingPayment = $data['pending_payment'] ?? null;

if (!$tenantId || !$ownerId || !$rentingId || $amount <= 0) {
    echo json_encode(["success" => false, "message" => "Invalid payment data."]);
    exit;
}

try {
    $db = (new Connection())->connect();
    $db->beginTransaction();

    $stmt = $db->prepare("SELECT balance FROM users WHERE id = ?");
    $stmt->execute([$tenantId]);
    $tenant = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$tenant || (float)$tenant['balance'] < $amount) {
        throw new Exception("Insufficient balance");
    }

    $db->prepare("UPDATE users SET balance = balance - ? WHERE id = ?")->execute([$amount, $tenantId]);
    $db->prepare("UPDATE users SET balance = balance + ? WHERE id = ?")->execute([$amount, $ownerId]);

    $db->prepare("UPDATE rentings SET total_paid = total_paid + ?, months_pending = ?, status = ?, pending_payment = ? WHERE id = ?")
       ->execute([$amount, $monthsPending, $status, $pendingPayment, $rentingId]);

    $referenceNo = "PAY-" . strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 8));
    $logTransaction = $db->prepare("
        INSERT INTO transactions (
            tenant_id, owner_id, renting_id, property_id, 
            amount, transaction_type, payment_method, 
            status, reference_number, months_paid, unit_occupancy
        ) VALUES (?, ?, ?, ?, ?, 'Rent Payment', 'Wallet', 'Success', ?, ?, ?)
    ");

    $logTransaction->execute([
        $tenantId, $ownerId, $rentingId, $propertyId, 
        $amount, $referenceNo, $monthsPaid, $unitOccupancy
    ]);

    $db->commit();
    echo json_encode(["success" => true, "message" => "Payment successful.", "reference_number" => $referenceNo]);
} catch (Exception $e) {
    if (isset($db) && $db->inTransaction()) { $db->rollBack(); }
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}