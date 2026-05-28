<?php

class Property
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getProperties(): array
    {
        return execQuery("CALL GetProperties()", null, $this->pdo);
    }

    public function getPropertiesByOwnerId(int $ownerId): array
    {
        return execQuery("CALL GetPropertiesByOwner(?)", [$ownerId], $this->pdo);
    }

    public function getPropertyById(int $id): array
    {
        return execQuery("CALL GetPropertyById(?)", [$id], $this->pdo);
    }

    public function addProperty(object $dt): array
    {
        $ownerId = $dt->owner_id ?? ($_SESSION['user_id'] ?? 0);

        $type = ($dt->type ?? '') === 'boarding house' ? 'apartment' : ($dt->type ?? '');

        $imageUrl = !empty($dt->image_url) ? $dt->image_url : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';
        $mapImageUrl = !empty($dt->map_image_url) ? $dt->map_image_url : 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80';

        $values = [
            'add',
            0,
            (int)$ownerId,
            $dt->name ?? '',
            $type,
            $dt->price_monthly ?? 0,
            $dt->location_address ?? '',
            $imageUrl,
            $mapImageUrl,
            $dt->amenities ?? '',
            'available'
        ];

        return execQuery("CALL ManageProperty(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", $values, $this->pdo);
    }

    public function updateProperty(int $id, object $dt): array
    {
        // 1. Verify Ownership & Existence
        $check = execQuery("SELECT owner_id FROM properties WHERE id = ?", [$id], $this->pdo);
        if (!$check['success'] || empty($check['data'])) {
            return ["success" => false, "message" => "Property does not exist.", "status" => 404];
        }

        $ownerId = $check['data'][0]['owner_id'];
        $authorizedUser = $_SESSION['user_id'] ?? 0;

        if ($ownerId != $authorizedUser) {
            return ["success" => false, "message" => "Unauthorized: Access denied.", "status" => 403];
        }

        $isStatusOnly = isset($dt->status_only) && $dt->status_only;
        $action = $isStatusOnly ? 'status' : 'edit';

        $type = ($dt->type ?? '') === 'boarding house' ? 'apartment' : ($dt->type ?? null);

        $values = [
            $action,
            $id,
            (int)$ownerId,
            $isStatusOnly ? null : ($dt->name ?? null),
            $isStatusOnly ? null : $type,
            $isStatusOnly ? null : ($dt->price_monthly ?? 0),
            $isStatusOnly ? null : ($dt->location_address ?? null),
            $isStatusOnly ? null : ($dt->image_url ?? null),
            $isStatusOnly ? null : ($dt->map_image_url ?? null),
            $isStatusOnly ? null : ($dt->amenities ?? null),
            $dt->status ?? 'available'
        ];

        return execQuery("CALL ManageProperty(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", $values, $this->pdo);
    }

    public function deleteProperty(int $id, int $currentUserId): array
    {
        $check = execQuery("SELECT owner_id FROM properties WHERE id = ?", [$id], $this->pdo);
        if (!$check['success'] || empty($check['data'])) {
            return ["success" => false, "message" => "Property not found.", "status" => 404];
        }
        if ($check['data'][0]['owner_id'] != $currentUserId) {
            return ["success" => false, "message" => "Unauthorized: You do not own this property.", "status" => 403];
        }

        return execQuery("CALL DeletePropertyCascade(?)", [$id], $this->pdo);
    }

    public function updateStatus($id, $status): array
    {
        try {
            $allowedStatuses = ['available', 'occupied', 'unavailable'];
            if (!in_array($status, $allowedStatuses)) {
                return [
                    "success" => false,
                    "message" => "Invalid status value provided.",
                    "status" => 400
                ];
            }

            $check = execQuery("SELECT status FROM properties WHERE id = ?", [$id], $this->pdo);
            if (!$check['success'] || empty($check['data'])) {
                return [
                    "success" => false,
                    "message" => "Property matching that identifier could not be found.",
                    "status" => 404
                ];
            }

            $sql = "UPDATE properties SET status = ? WHERE id = ?";
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([$status, (int)$id]);

            return [
                "success" => true,
                "message" => "Property status changed to " . $status . " successfully.",
                "status" => 200
            ];
        } catch (\PDOException $e) {
            return [
                "success" => false,
                "message" => "Database exception thrown during status modification: " . $e->getMessage(),
                "status" => 500
            ];
        }
    }

    public function getAllTransactions(): array
    {
        return execQuery("CALL GetAllTransactions()", null, $this->pdo);
    }

    public function getFilteredTransactions(?int $userId, ?string $unitOccupancy): array
    {
        $sql = "CALL GetFilteredTransactions(?, ?)";
        return execQuery($sql, [$userId, $unitOccupancy], $this->pdo);
    }
}
