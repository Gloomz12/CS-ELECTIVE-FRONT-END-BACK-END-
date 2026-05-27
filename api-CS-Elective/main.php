<?php

/* Group 2
Eryhn Jann Dulay
Roms Anton Aban
Marc Alexis
*/

session_set_cookie_params([
    'lifetime' => 86400,
    'path' => '/',
    'domain' => 'localhost',
    'secure' => false,
    'httponly' => true
]);

session_start();

$origin = $_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:3000';

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/util/functions.php';
require_once __DIR__ . '/util/Encryption.php';
require_once __DIR__ . '/config/db.php';

require_once 'models/Auth.model.php';
require_once 'models/Property.model.php';
require_once 'models/User.model.php';
require_once 'models/Rental.model.php';
require_once 'models/Payment.model.php';
require_once 'models/Admin.model.php';
require_once 'models/Inquiries.model.php';

$database = new Connection();
$pdo = $database->connect();

$auth = new Auth($pdo);
$property = new Property($pdo);
$user = new User($pdo);
$rental = new Rental($pdo);
$payment = new Payment($pdo);
$admin = new Admin($pdo);
$inquiry = new Inquiry($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$requestStr = isset($_GET['request']) ? $_GET['request'] : '';
$request = explode('/', trim($requestStr, '/'));

$rawInput = file_get_contents("php://input");
$data = json_decode($rawInput);

if (!$data) {
    $data = new stdClass();
}

$endpoint   = $request[0] ?? null;
$subRoute   = $request[1] ?? null;
$childParam = $request[2] ?? null;

switch ($endpoint) {

    case 'auth':
        if ($method === 'POST' && $subRoute === 'register') sendResponse($auth->register($data));
        if ($method === 'POST' && $subRoute === 'login') sendResponse($auth->login($data));
        if ($method === 'POST' && $subRoute === 'logout') sendResponse($auth->logout());
        if ($method === 'GET' && $subRoute === 'check') {
            sendResponse([
                "success" => true,
                "logged_in" => isset($_SESSION['user_id'])
            ]);
        }
        break;

    case 'users':
        if ($method === 'GET' && $subRoute === 'profile') {
            $sessionUserId = $_SESSION['user_id'] ?? 0;
            $targetUserId = $_GET['user_id'] ?? $data->user_id ?? $sessionUserId;

            if (!$targetUserId) {
                http_response_code(401);
                sendResponse(["success" => false, "message" => "User ID required. Please log in."]);
                break;
            }

            $res = $user->getProfile((int)$targetUserId);

            if ($res['success'] && !empty($res['data'])) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "version" => "production_clean",
                    "data" => $res['data'][0]
                ]);
            } else {
                http_response_code(404);
                sendResponse(["success" => false, "message" => "User profile not found."]);
            }
        }

        if ($method === 'PUT' && $subRoute === 'profile') {
            $rawInput = json_decode(file_get_contents('php://input'));
            if ($rawInput) {
                $data = $rawInput;
            } else {
                $data = (object)$_POST;
            }

            if (!isset($data->user_id)) {
                $data->user_id = $_SESSION['user_id'] ?? ($_GET['user_id'] ?? null);
            }

            if (!$data->user_id) {
                http_response_code(400);
                sendResponse(["success" => false, "message" => "User ID verification parameter required"]);
                break;
            }

            $directory = '/images/profilePics/';
            $profilePicture = '';

            if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_OK) {
                $fileName = basename($_FILES['profile_image']['name']);
                $targetFilePath = $directory . $fileName;

                if (move_uploaded_file($_FILES['profile_image']['tmp_name'], $targetFilePath)) {
                    $profilePicture = $targetFilePath;
                }
            }

            if (empty($profilePicture)) {
                $currentPic = $data->profile_picture ?? $_POST['profile_picture'] ?? '';

                if (strpos($currentPic, 'blob:') === 0 || empty($currentPic)) {
                    $fallbackCheck = $user->getProfile((int)$data->user_id);
                    if ($fallbackCheck['success'] && !empty($fallbackCheck['data'])) {
                        $profilePicture = $fallbackCheck['data'][0]['profile_picture'] ?? '';
                    }
                } else {
                    $fileNameOnly = basename($currentPic);
                    $profilePicture = !empty($fileNameOnly) ? $directory . $fileNameOnly : '';
                }
            }

            $data->profile_picture = $profilePicture;

            if (isset($data->payment_methods)) {
                if (!is_string($data->payment_methods)) {
                    $data->payment_methods = json_encode($data->payment_methods);
                }
            } else {
                $data->payment_methods = $_POST['payment_methods'] ?? '{}';
            }

            $res = $user->updateProfile($data);

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "message" => "Settings updated successfully",
                    "new_profPic" => $profilePicture
                ]);
            } else {
                http_response_code(500);
                sendResponse($res);
            }
        }
        break;

    case 'properties':
        if ($method === 'GET') {
            if ($subRoute === 'transactions') {
                $res = $property->getAllTransactions();
                error_log("RAW API RESPONSE: " . json_encode($res));
                http_response_code($res['success'] ? 200 : 500);
                sendResponse($res);
                break;
            }

            if ($subRoute === 'filter-transactions') {
                $userId = $_GET['user_id'] ?? null;
                $unit = $_GET['unit'] ?? null;
                $res = $property->getFilteredTransactions((int)$userId, $unit);
                http_response_code($res['success'] ? 200 : 500);
                sendResponse($res);
                break;
            }

            if ($subRoute === 'owner') {
                $currentUserId = $_SESSION['user_id'] ?? 0;
                $res = $property->getPropertiesByOwnerId((int)$currentUserId);
                http_response_code($res['success'] ? 200 : 500);
                sendResponse($res);
                break;
            }

            if ($subRoute && is_numeric($subRoute)) {
                $res = $property->getPropertyById((int)$subRoute);
                if ($res['success'] && !empty($res['data'])) {
                    http_response_code(200);
                    sendResponse(["success" => true, "data" => $res['data'][0]]);
                } else {
                    http_response_code(404);
                    sendResponse(["success" => false, "message" => "Property not found."]);
                }
            } else {
                $res = $property->getProperties();
                http_response_code($res['success'] ? 200 : 500);
                sendResponse($res);
            }
            break;
        }

        if ($method === 'POST') {
            $data = empty((array)$data) ? (object)$_POST : $data;

            // Image File Processing
            $propDir = '/images/properties/';
            if (isset($_FILES['property_image']) && $_FILES['property_image']['error'] === UPLOAD_ERR_OK) {
                $propFile = basename($_FILES['property_image']['name']);
                if (move_uploaded_file($_FILES['property_image']['tmp_name'], $propDir . $propFile)) {
                    $data->property_image = $propDir . $propFile;
                }
            }

            // Map File Processing
            $mapDir = '/images/maps/';
            if (isset($_FILES['map_image']) && $_FILES['map_image']['error'] === UPLOAD_ERR_OK) {
                $mapFile = basename($_FILES['map_image']['name']);
                if (move_uploaded_file($_FILES['map_image']['tmp_name'], $mapDir . $mapFile)) {
                    $data->map_image = $mapDir . $mapFile;
                }
            }

            $res = $property->addProperty($data);
            http_response_code($res['success'] ? 201 : 400);
            sendResponse($res);
            break;
        }

        if ($method === 'PUT' && $subRoute && is_numeric($subRoute)) {
            // Read incoming structured JSON or merge form fields if using multipart/form-data
            $rawInput = json_decode(file_get_contents('php://input'));
            if ($rawInput) {
                $data = $rawInput;
            } else {
                $data = (object)$_POST;
            }

            // Image File Processing
            $propDir = '/images/properties/';
            if (isset($_FILES['property_image']) && $_FILES['property_image']['error'] === UPLOAD_ERR_OK) {
                $propFile = basename($_FILES['property_image']['name']);
                if (move_uploaded_file($_FILES['property_image']['tmp_name'], $propDir . $propFile)) {
                    $data->property_image = $propDir . $propFile;
                }
            } else {
                $data->property_image = $data->property_image ?? $_POST['property_image'] ?? '';
            }

            // Map File Processing
            $mapDir = '/images/maps/';
            if (isset($_FILES['map_image']) && $_FILES['map_image']['error'] === UPLOAD_ERR_OK) {
                $mapFile = basename($_FILES['map_image']['name']);
                if (move_uploaded_file($_FILES['map_image']['tmp_name'], $mapDir . $mapFile)) {
                    $data->map_image = $mapDir . $mapFile;
                }
            } else {
                $data->map_image = $data->map_image ?? $_POST['map_image'] ?? '';
            }

            $res = $property->updateProperty((int)$subRoute, $data);
            http_response_code($res['status'] ?? 200);
            sendResponse($res);
            break;
        }

        if ($method === 'DELETE' && $subRoute) {
            $res = $property->deleteProperty((int)$subRoute, $_SESSION['user_id'] ?? 0);
            sendResponse($res);
            break;
        }

        http_response_code(404);
        sendResponse(["success" => false, "message" => "Endpoint not found."]);
        break;

    case 'leases':
        if ($method === 'POST') {
            if (empty($data) || count((array)$data) === 0) {
                $data = (object)json_decode(file_get_contents("php://input"));
            }

            $res = $rental->addLease($data);
            http_response_code($res['success'] ? 201 : 400);
            sendResponse($res);
        }

        if ($method === 'GET' && $subRoute && is_numeric($subRoute)) {
            $leaseId = (int)$subRoute;
            $res = $rental->getLeaseById($leaseId);

            if ($res['success'] && !empty($res['data'])) {
                http_response_code(200);
                sendResponse(["success" => true, "data" => $res['data'][0]]);
            } else {
                http_response_code(404);
                sendResponse(["success" => false, "message" => "Lease contract record not found."]);
            }
            break;
        }

        if ($method === 'GET' && !$subRoute) {
            $targetUserId = null;

            if (isset($_SESSION['user_id']) && is_numeric($_SESSION['user_id'])) {
                $targetUserId = (int)$_SESSION['user_id'];
            }

            if (!$targetUserId) {
                http_response_code(401);
                sendResponse([
                    "success" => false,
                    "message" => "Authentication required: User identification target missing parameter context."
                ]);
                break;
            }

            $res = $rental->getUserLeases($targetUserId);
            http_response_code($res['success'] ? 200 : 500);
            sendResponse($res);
        }
        break;

    case 'tenants':
        if ($method === 'POST') {
            if (empty($data) || count((array)$data) === 0) {
                $data = (object)json_decode(file_get_contents("php://input"));
            }

            $res = $rental->addTenant($data);
            http_response_code($res['success'] ? 201 : 400);
            sendResponse($res);
        }

        if ($method === 'GET') {
            $propertyId = $_GET['property_id'] ?? null;
            if (!$propertyId) {
                http_response_code(400);
                sendResponse(["success" => false, "message" => "Property ID parameter required."]);
                break;
            }

            $res = $rental->getTenantsByProperty((int)$propertyId);
            http_response_code($res['success'] ? 200 : 500);
            sendResponse($res);
        }
        break;

    case 'payments':
        if ($method === 'POST') {
            $rawInput = file_get_contents("php://input");
            $data = json_decode($rawInput, true);

            if (empty($data)) {
                http_response_code(400);
                sendResponse(["success" => false, "message" => "No data provided or invalid JSON"]);
                exit;
            }

            $res = $payment->postPayment($data);
            http_response_code($res['success'] ? 201 : 400);
            sendResponse($res);
            break;
        }

        if ($method === 'GET' && $subRoute === 'tenant' && $childParam) {
            $targetUserId = (int)$childParam;
            $sessionUserId = $_SESSION['user_id'] ?? null;

            if ($sessionUserId !== $targetUserId) {
                http_response_code(403);
                sendResponse(["success" => false, "message" => "Unauthorized access."]);
                break;
            }

            $res = $payment->getTenantHistory($targetUserId);
            http_response_code($res['success'] ? 200 : 500);
            sendResponse($res);
            break;
        }

        http_response_code(404);
        sendResponse(["success" => false, "message" => "Payment route not found."]);
        break;

    case 'admin':
        $sessionUserId = $_SESSION['user_id'] ?? null;

        if (!$sessionUserId) {
            http_response_code(401);
            sendResponse(["success" => false, "message" => "Unauthorized access: Please log in."]);
            break;
        }

        if ($method === 'GET' && $subRoute === 'properties') {
            $res = execQuery("CALL GetPropertiesByOwner(?)", [(int)$sessionUserId], $pdo);

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "version" => "production_clean",
                    "data" => $res['data']
                ]);
            } else {
                http_response_code(500);
                sendResponse(["success" => false, "message" => "Failed to retrieve real estate directory records."]);
            }
        }

        if ($method === 'GET' && $subRoute === 'tenants') {
            $res = execQuery("CALL GetTenantsByOwner(?)", [(int)$sessionUserId], $pdo);

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "version" => "production_clean",
                    "data" => $res['data']
                ]);
            } else {
                http_response_code(500);
                sendResponse(["success" => false, "message" => "Failed to retrieve active tenant directory."]);
            }
        }

        if ($method === 'DELETE' && $subRoute === 'tenants' && $childParam) {
            $res = $rental->removeTenant((int)$childParam);
            http_response_code($res['status']);
            sendResponse($res);
            break;
        }

    case 'reports':
        $sessionUserId = $_SESSION['user_id'] ?? null;

        if (!$sessionUserId) {
            http_response_code(401);
            sendResponse(["success" => false, "message" => "Unauthorized access: Please log in."]);
            break;
        }

        if ($method === 'GET' && $subRoute === 'rent-payments') {
            $sql = "SELECT 
                        SUM(t.amount) AS total_collected,
                        COUNT(t.id) AS total_transactions,
                        MONTHNAME(t.created_at) AS month
                    FROM transactions t
                    WHERE t.status = 'Success' AND t.owner_id = ?
                    GROUP BY MONTH(t.created_at), MONTHNAME(t.created_at)";

            $res = execQuery($sql, [(int)$sessionUserId], $pdo);

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "version" => "production_clean",
                    "data" => $res['data']
                ]);
            } else {
                http_response_code(500);
                sendResponse(["success" => false, "message" => "Failed to aggregate monthly transactional revenue matrices."]);
            }
        }

        if ($method === 'GET' && $subRoute === 'occupancy') {
            $sql = "SELECT 
                        IFNULL(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) AS occupied_units,
                        COUNT(id) AS total_units,
                        CASE 
                            WHEN COUNT(id) > 0 THEN (IFNULL(SUM(CASE WHEN status = 'occupied' THEN 1 ELSE 0 END), 0) / COUNT(id)) * 100
                            ELSE 0.00
                        END AS occupancy_rate
                    FROM properties 
                    WHERE owner_id = ?";

            $res = execQuery($sql, [(int)$sessionUserId], $pdo);

            if ($res['success'] && !empty($res['data'])) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "version" => "production_clean",
                    "data" => $res['data'][0]
                ]);
            } else {
                http_response_code(500);
                sendResponse(["success" => false, "message" => "Failed to execute housing property occupancy calculations."]);
            }
        }
        break;

    case 'inquiries':
        $sessionUserId = $_SESSION['user_id'] ?? 2;

        if (!$sessionUserId) {
            http_response_code(401);
            sendResponse(["success" => false, "message" => "Unauthorized access: Please log in."]);
            break;
        }

        if ($method === 'GET' && !$subRoute) {
            $res = $inquiry->getAll();

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "version" => "production_clean",
                    "data" => $res['data']
                ]);
            } else {
                http_response_code(500);
                sendResponse(["success" => false, "message" => "Failed to retrieve pending inquiries directory."]);
            }
        }

        if ($method === 'POST' && !$subRoute) {
            if (empty($data) || count((array)$data) === 0) {
                $data = (object)json_decode(file_get_contents("php://input"));
            }

            $data->tenant_id = $sessionUserId;

            $res = $inquiry->create($data);

            if ($res['success']) {
                http_response_code(201);
                sendResponse([
                    "success" => true,
                    "message" => "Inquiry application filed successfully.",
                    "version" => "production_clean"
                ]);
            } else {
                http_response_code(400);
                sendResponse(["success" => false, "message" => "Failed to process housing reservation inquiry."]);
            }
        }

        if ($method === 'POST' && $subRoute === 'accept') {
            if (empty($data) || count((array)$data) === 0) {
                $data = (object)json_decode(file_get_contents("php://input"));
            }

            if (!isset($data->inquiry_id, $data->unit_occupancy)) {
                http_response_code(400);
                sendResponse(["success" => false, "message" => "Missing parameters: 'inquiry_id' and 'unit_occupancy' are required."]);
                break;
            }

            $res = $inquiry->approveInquiry($data);

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "message" => "Payment processed. Tenant contract status converted to active.",
                    "version" => "production_clean"
                ]);
            } else {
                http_response_code(400);
                sendResponse($res);
            }
        }

        if ($method === 'POST' && $subRoute === 'decline') {
            if (empty($data) || count((array)$data) === 0) {
                $data = (object)json_decode(file_get_contents("php://input"));
            }

            $targetId = $data->id ?? $data->inquiry_id ?? null;

            if (!$targetId) {
                http_response_code(400);
                sendResponse(["success" => false, "message" => "Target row identifier parameters are missing."]);
                break;
            }

            $res = $inquiry->delete((int)$targetId);

            if ($res['success']) {
                http_response_code(200);
                sendResponse([
                    "success" => true,
                    "message" => "Inquiry declined and removed successfully.",
                    "version" => "production_clean"
                ]);
            } else {
                http_response_code(500);
                sendResponse(["success" => false, "message" => "Failed to discard application inquiry element."]);
            }
        }
        break;
}
