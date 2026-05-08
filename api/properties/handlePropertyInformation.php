<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit();
}

require_once '../config/db.php';
$database = new Connection();
/** @var PDO $conn */
$conn = $database->connect();

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->action)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Action not specified."]);
    exit();
}

try {
    if ($data->action === 'add') {
        if (empty($data->owner_id) || empty($data->name) || empty($data->price_monthly) || empty($data->location_address)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing required fields for adding property."]);
            exit();
        }

        $query = "INSERT INTO properties 
                  (owner_id, name, type, price_monthly, location_address, image_url, map_image_url, amenities, status) 
                  VALUES 
                  (:owner_id, :name, :type, :price_monthly, :location_address, :image_url, :map_image_url, :amenities, 'available')";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':owner_id' => $data->owner_id,
            ':name' => $data->name,
            ':type' => $data->type,
            ':price_monthly' => $data->price_monthly,
            ':location_address' => $data->location_address,
            ':image_url' => $data->image_url,
            ':map_image_url' => $data->map_image_url,
            ':amenities' => $data->amenities ?? ''
        ]);

        echo json_encode([
            "success" => true, 
            "message" => "Property added successfully.", 
            "property_id" => $conn->lastInsertId()
        ]);

    } elseif ($data->action === 'edit') {
        if (empty($data->id) || empty($data->name) || empty($data->price_monthly) || empty($data->location_address)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing required fields for updating property."]);
            exit();
        }

        $query = "UPDATE properties 
                  SET name = :name, type = :type, price_monthly = :price_monthly, 
                      location_address = :location_address, image_url = :image_url, 
                      map_image_url = :map_image_url, amenities = :amenities 
                  WHERE id = :id";
        
        $stmt = $conn->prepare($query);
        $stmt->execute([
            ':id' => $data->id,
            ':name' => $data->name,
            ':type' => $data->type,
            ':price_monthly' => $data->price_monthly,
            ':location_address' => $data->location_address,
            ':image_url' => $data->image_url,
            ':map_image_url' => $data->map_image_url,
            ':amenities' => $data->amenities ?? ''
        ]);

        echo json_encode(["success" => true, "message" => "Property updated successfully."]);
        
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid action."]);
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}