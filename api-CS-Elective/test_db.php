<?php
$env = parse_ini_file(__DIR__ . '/.env');

$host    = $env['DB_SERVER'];
$db      = $env['DB_NAME'];
$user    = $env['DB_USER'];
$pass    = $env['DB_PASS'];
$charset = $env['DB_CHARSET'];

header('Content-Type: application/json');

try {
    $dsn = "mysql:host=$host;dbname=$db;charset=$charset";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);

    $query = $pdo->query("SHOW PROCEDURE STATUS WHERE Name = 'UpdateUserProfile'");
    $routineExists = $query->fetch();

    echo json_encode([
        "success" => true,
        "message" => "Database connection successful!",
        "database" => $db,
        "routine_found" => $routineExists ? "Yes" : "No (Check if you ran the SQL script)"
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Connection failed: " . $e->getMessage()
    ]);
}