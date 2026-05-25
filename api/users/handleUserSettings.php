<?php
header("Access-Control-Allow-Origin: http://localhost:3000"); 
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

require_once '../config/db.php';

$database = new Connection();
/** @var PDO $conn */
$conn = $database->connect();

$userId = $_POST['user_id'] ?? null;

if (!$userId) {
    echo json_encode(["success" => false, "message" => "User ID required"]);
    exit;
}

$profPicUrl = $_POST['current_profPic'] ?? '';

if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
    $uploadDir = '../../public/images/CSElective_images/';
    
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $fileTmpPath = $_FILES['profile_image']['tmp_name'];
    $fileName = $_FILES['profile_image']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    
    $newFileName = time() . '_' . uniqid() . '.' . $fileExtension;
    $destPath = $uploadDir . $newFileName;

    if (move_uploaded_file($fileTmpPath, $destPath)) {
        $profPicUrl = 'http://localhost/public/images/CSElective_images/' . $newFileName; 
    } else {
        echo json_encode(["success" => false, "message" => "Failed to move uploaded file."]);
        exit;
    }
} else {
    if (strpos($profPicUrl, 'blob:') === 0) {
        $stmt = $conn->prepare("SELECT profile_picture FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $profPicUrl = $stmt->fetchColumn() ?: "https://via.placeholder.com/150";
    }
}

try {
    $stmt = $conn->prepare("
        UPDATE users 
        SET 
            username = ?, 
            full_name = ?, 
            phone_number = ?, 
            date_of_birth = ?, 
            address = ?, 
            country = ?, 
            gender = ?, 
            profile_picture = ?, 
            payment_methods = ? 
        WHERE id = ?
    ");

    $stmt->execute([
        $_POST['username'] ?? '',
        $_POST['full_name'] ?? '',    
        $_POST['phone_number'] ?? '',
        $_POST['date_of_birth'] ?? '', 
        $_POST['address'] ?? '',
        $_POST['country'] ?? '',
        $_POST['gender'] ?? '',
        $profPicUrl,      
        $_POST['payment_methods'] ?? '{}', 
        $userId
    ]);

    echo json_encode([
        "success" => true, 
        "message" => "Settings updated successfully",
        "new_profPic" => $profPicUrl
    ]);
} catch (PDOException $e) {
    echo json_encode(["success" => false, "message" => "Database error: " . $e->getMessage()]);
}
?>