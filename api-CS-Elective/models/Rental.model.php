<?php
class Rental
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getUserLeases(int $userId): array
    {
        $sql = "CALL GetUserLeases(?)";

        return execQuery($sql, [$userId], $this->pdo);
    }

    public function getLeaseById(int $leaseId): array
    {
        return execQuery("CALL GetLeaseDetails(?)", [$leaseId], $this->pdo);
    }

    public function getTenantsByProperty(int $propertyId): array
    {
        return execQuery("CALL GetTenantsByProperty(?)", [$propertyId], $this->pdo);
    }

    public function addTenant(object $dt): array
    {
        $sql = "INSERT INTO rentings (property_id, tenant_id, role, status, start_date) VALUES (?, ?, ?, 'Active', CURDATE())";
        return execQuery($sql, [$dt->property_id, $dt->tenant_id, $dt->role], $this->pdo);
    }

    public function addLease(object $dt): array
    {
        if (!isset($dt->property_id, $dt->tenant_id, $dt->monthly_rate, $dt->lease_term)) {
            return ["success" => false, "message" => "Incomplete lease data.", "status" => 400];
        }

        $monthly_rate = floatval($dt->monthly_rate);
        $lease_term = intval($dt->lease_term);
        $total_due = $monthly_rate * $lease_term;

        $sql = "INSERT INTO rentings (
                    property_id, tenant_id, property_name, monthly_rate, 
                    lease_term, total_due, pending_payment, status, start_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Active', CURDATE())";

        $values = [
            $dt->property_id,
            $dt->tenant_id,
            $dt->property_name ?? '',
            $monthly_rate,
            $lease_term,
            $total_due,
            $total_due
        ];

        return execQuery($sql, $values, $this->pdo);
    }

    public function removeTenant(int $tenantId): array
    {
        try {
            $stmt = $this->pdo->prepare("CALL RemoveTenant(?)");
            $stmt->execute([(int)$tenantId]);
            if ($stmt->rowCount() > 0) {
                return ["success" => true, "message" => "Tenant record removed.", "status" => 200];
            } else {
                return ["success" => false, "message" => "Tenant not found or could not be removed.", "status" => 404];
            }
        } catch (PDOException $e) {
            return ["success" => false, "message" => "Database error: " . $e->getMessage(), "status" => 500];
        }
    }
}
