<?php
// header("Access-Control-Allow-Origin: http://localhost:3000");
// header("Access-Control-Allow-Methods: POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type, Authorization");
// header("Content-Type: application/json; charset=UTF-8");

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     http_response_code(204);
//     exit();
// }

// require_once '../config/db.php';
// $database = new Connection();
// $conn = $database->connect();

// $action = $_POST['action'] ?? '';

// try {
//     if ($action === 'add' || $action === 'edit') {
//         $propertyUploadDir = '../../public/images/properties/';
//         $mapUploadDir = '../../public/images/map/';

//         $uploadedPaths = [];
//         if (isset($_FILES['property_images']) && is_array($_FILES['property_images']['name'])) {
//             $fileCount = count($_FILES['property_images']['name']);
//             $maxFiles = min($fileCount, 5);

//             for ($i = 0; $i < $maxFiles; $i++) {
//                 if ($_FILES['property_images']['error'][$i] === UPLOAD_ERR_OK) {
//                     $fileName = time() . '_' . $i . '_' . basename($_FILES['property_images']['name'][$i]);
//                     $targetFilePath = $propertyUploadDir . $fileName;

//                     if (move_uploaded_file($_FILES['property_images']['tmp_name'][$i], $targetFilePath)) {
//                         $uploadedPaths[] = 'images/properties/' . $fileName;
//                     }
//                 }
//             }
//         }

//         // Determine property image path string
//         if (!empty($uploadedPaths)) {
//             $imagePathString = implode('|', $uploadedPaths);
//         } else {
//             $imagePathString = $_POST['image_url'] ?? '';
//         }

//         $mapPathString = $_POST['map_image_url'] ?? ''; 
//         if (isset($_FILES['map_image']) && $_FILES['map_image']['error'] === UPLOAD_ERR_OK) {
//             $mapFileName = time() . '_map_' . basename($_FILES['map_image']['name']);
//             $targetMapPath = $mapUploadDir . $mapFileName;

//             if (move_uploaded_file($_FILES['map_image']['tmp_name'], $targetMapPath)) {
//                 $mapPathString = 'images/map/' . $mapFileName;
//             }
//         }

//         if ($action === 'add') {
//             if (empty($imagePathString)) {
//                 $imagePathString = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80';
//             }
//             if (empty($mapPathString)) {
//                 $mapPathString = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=800&q=80';
//             }

//             $query = "INSERT INTO properties (owner_id, name, type, price_monthly, location_address, image_url, map_image_url, amenities, status) 
//                       VALUES (:owner_id, :name, :type, :price_monthly, :location_address, :image_url, :map_image_url, :amenities, 'available')";
//             $stmt = $conn->prepare($query);
//             $stmt->execute([
//                 ':owner_id' => $_POST['owner_id'],
//                 ':name' => $_POST['name'],
//                 ':type' => $_POST['type'] === 'boarding house' ? 'apartment' : $_POST['type'],
//                 ':price_monthly' => $_POST['price_monthly'],
//                 ':location_address' => $_POST['location'],
//                 ':image_url' => $imagePathString,
//                 ':map_image_url' => $mapPathString,
//                 ':amenities' => $_POST['amenities'] ?? ''
//             ]);
//             echo json_encode(["success" => true, "message" => "Property added successfully."]);
//         } elseif ($action === 'edit') {
//             $query = "UPDATE properties SET name = :name, type = :type, price_monthly = :price_monthly, 
//                       location_address = :location_address, image_url = :image_url, 
//                       map_image_url = :map_image_url, amenities = :amenities 
//                       WHERE id = :id";
//             $stmt = $conn->prepare($query);
//             $stmt->execute([
//                 ':id' => $_POST['id'],
//                 ':name' => $_POST['name'],
//                 ':type' => $_POST['type'] === 'boarding house' ? 'apartment' : $_POST['type'],
//                 ':price_monthly' => $_POST['price_monthly'],
//                 ':location_address' => $_POST['location'],
//                 ':image_url' => $imagePathString,
//                 ':map_image_url' => $mapPathString,
//                 ':amenities' => $_POST['amenities'] ?? ''
//             ]);
//             echo json_encode(["success" => true, "message" => "Property updated successfully."]);
//         }
//     } else {
//         http_response_code(400);
//         echo json_encode(["success" => false, "message" => "Invalid action."]);
//     }
// } catch (PDOException $e) {
//     http_response_code(500);
//     echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
// }
