<?php
// header("Access-Control-Allow-Origin: http://localhost:3000");
// header("Access-Control-Allow-Methods: POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");
// header("Content-Type: application/json");

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     exit;
// }

// if (session_status() === PHP_SESSION_NONE) {
//     session_start();
// }

// require_once '../config/db.php';

// $database = new Connection();
// /** @var PDO $conn */
// $conn = $database->connect();

// $data = json_decode(file_get_contents("php://input"), true);

// $userId = $_SESSION['user_id'] ?? ($data['user_id'] ?? null);

// if ($userId) {
//     try {
//         $stmt = $conn->prepare("
//             SELECT 
//                 id, username, email, balance, created_at, profile_picture,
//                 full_name, phone_number, date_of_birth, address, country, 
//                 gender, payment_methods 
//             FROM users 
//             WHERE id = ?
//         ");
//         $stmt->execute([$userId]);
//         $user = $stmt->fetch(PDO::FETCH_ASSOC);

//         if ($user) {
//             echo json_encode(["success" => true, "version" => "test_3", "data" => $user]);
//         } else {
//             echo json_encode(["success" => false, "message" => "User not found"]);
//         }
//     } catch (PDOException $e) {
//         echo json_encode(["success" => false, "message" => "Database error"]);
//     }
// } else {
//     echo json_encode(["success" => false, "message" => "User ID required. Please log in."]);
// }