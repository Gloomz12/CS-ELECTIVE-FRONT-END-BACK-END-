<?php

class Payment
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function postPayment(array $data): array
    {
        $referenceNumber = 'PAY-' . strtoupper(bin2hex(random_bytes(4)));

        $params = [
            $data['tenant_id'],
            $data['owner_id'],
            $data['renting_id'],
            $data['property_id'],
            $data['unit_occupancy'],
            (float)$data['amount'],
            (int)$data['months_paid'],
            (int)$data['months_pending'],
            $data['status'] ?? 'Success',
            (float)$data['pending_payment'],
            $data['payment_method'],
            $referenceNumber
        ];

        try {
            $res = execQuery("CALL PostPaymentRecord(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", $params, $this->pdo);

            return [
                "success" => true,
                "message" => "Payment processed successfully.",
                "reference_number" => $referenceNumber,
                "data" => $res
            ];
        } catch (\Exception $e) {
            return [
                "success" => false,
                "message" => "Payment failed: " . $e->getMessage()
            ];
        }
    }
    
    public function getTenantHistory(int $userId): array
    {
        return execQuery("CALL GetTenantHistory(?)", [$userId], $this->pdo);
    }
}
