<?php

class Inquiry
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function create(object $data): array
    {
        $values = [
            $data->property_id ?? null,
            $data->tenant_id ?? null,
            $data->lease_term_months ?? $data->lease_term ?? null,
            $data->tenant_name ?? '',
            $data->property_name ?? '',
            $data->message ?? ''
        ];

        return execQuery("CALL CreateInquiry(?, ?, ?, ?, ?, ?)", $values, $this->pdo);
    }

    public function getAll(): array
    {
        return execQuery("CALL GetAllInquiries()", [], $this->pdo);
    }

    public function updateStatus(int $inquiry_id, string $status): array
    {
        return execQuery("CALL UpdateInquiryStatus(?, ?)", [$inquiry_id, $status], $this->pdo);
    }

    public function delete(int $inquiry_id): array
    {
        return execQuery("CALL DeleteInquiry(?)", [$inquiry_id], $this->pdo);
    }

    public function approveInquiry(object $data): array
    {
        $values = [
            $data->inquiry_id ?? null,
            $data->unit_occupancy ?? null
        ];

        if (empty($values[0]) || empty($values[1])) {
            return [
                "success" => false,
                "message" => "Validation client error: Parameters missing inside data package mappings."
            ];
        }

        try {
            $res = execQuery("CALL ApproveInquiryRoutine(?, ?)", $values, $this->pdo);

            return [
                "success" => true,
                "message" => "Payment processed. Tenant contract status converted to active."
            ];
        } catch (PDOException $e) {
            return [
                "success" => false,
                "message" => $e->getMessage()
            ];
        } catch (Exception $e) {
            return [
                "success" => false,
                "message" => "Application interface layer error: " . $e->getMessage()
            ];
        }
    }
}
