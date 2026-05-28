<?php
class Admin
{
    private \PDO $pdo;
    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getOccupancy(): array
    {
        return execQuery("CALL GetOccupancyReport()", null, $this->pdo);
    }

    public function getRevenue(): array
    {
        return execQuery("CALL GetRevenueReport()", null, $this->pdo);
    }

    public function listAllTenants(): array
    {
        return execQuery("CALL GetAllTenantsAdmin()", null, $this->pdo);
    }

    public function getAllTenants(): array
    {
        $sql = "SELECT 
                u.id as user_id, 
                u.full_name, 
                u.email, 
                r.id as lease_id, 
                r.property_name, 
                r.status as lease_status,
                r.total_paid
            FROM users u
            INNER JOIN rentings r ON u.id = r.tenant_id
            ORDER BY u.full_name ASC";

        return execQuery($sql, null, $this->pdo);
    }


}
