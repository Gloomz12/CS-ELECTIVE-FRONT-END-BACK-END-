<?php
/**
 * @param string $sql 
 * @param array|null $params 
 * @param \PDO $pdo 
 * @return array 
 */
function execQuery(string $sql, ?array $params, \PDO $pdo): array {
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        if (stripos($sql, 'SELECT') === 0 || stripos($sql, 'CALL') === 0) {
            $data = $stmt->fetchAll(\PDO::FETCH_ASSOC); 
            return [
                "success" => true,
                "data" => $data,
                "status" => 200
            ];
        }

        return [
            "success" => true,
            "affected_rows" => $stmt->rowCount(),
            "status" => 200
        ];

    } catch (\PDOException $e) {
        return [
            "success" => false,
            "message" => "Database Error: " . $e->getMessage(),
            "status" => 500
        ];
    } catch (\Exception $e) {
        return [
            "success" => false,
            "message" => "General Error: " . $e->getMessage(),
            "status" => 400
        ];
    }
}

/**
 * @param array $response The response data array.
 */
function sendResponse(array $response): void {
    if (isset($response['status'])) {
        http_response_code((int)$response['status']);
    }
    header('Content-Type: application/json');
    echo json_encode($response);
    exit;
}

/**
 * @param object $dt 
 * @param array $fields 
 * @return bool|string 
 */
function validateFields(object $dt, array $fields): bool|string {
    foreach ($fields as $field) {
        if (!isset($dt->$field) || empty(trim((string)$dt->$field))) {
            return "Field '$field' is required.";
        }
    }
    return true;
}
?>