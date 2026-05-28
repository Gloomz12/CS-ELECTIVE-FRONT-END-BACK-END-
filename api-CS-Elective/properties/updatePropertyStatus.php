<?php
// header("Access-Control-Allow-Origin: http://localhost:3000");
// header("Access-Control-Allow-Methods: POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");
// header("Content-Type: application/json; charset=UTF-8");

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     http_response_code(204);
//     exit();
// }

// require_once '../config/db.php';
// $database = new Connection();

// /** @var PDO $conn */
// $conn = $database->connect();

// $data = json_decode(file_get_contents("php://input"));

// if (!empty($data->id) && !empty($data->status)) {

//     $query = "UPDATE properties SET status = :status WHERE id = :id";
//     $stmt = $conn->prepare($query);

//     $status = htmlspecialchars(strip_tags($data->status));
//     $id = htmlspecialchars(strip_tags($data->id));

//     $stmt->bindParam(":status", $status);
//     $stmt->bindParam(":id", $id);

//     if ($stmt->execute()) {
//         http_response_code(200);
//         echo json_encode(["success" => true, "message" => "Property status updated successfully."]);
//     } else {
//         http_response_code(503);
//         echo json_encode(["success" => false, "message" => "Unable to update property status."]);
//     }
// } else {
//     http_response_code(400);
//     echo json_encode(["success" => false, "message" => "Incomplete data. Both ID and status are required."]);
// }
