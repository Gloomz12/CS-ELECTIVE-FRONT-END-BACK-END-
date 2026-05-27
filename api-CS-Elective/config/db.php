<?php
$env = parse_ini_file(__DIR__ . '/.env');

define("SERVER", $env['DB_SERVER']);
define("DBASE", $env['DB_NAME']);
define("USER", $env['DB_USER']);
define("PWORD", $env['DB_PASS']);
define("CHARSET", $env['DB_CHARSET']);

define('ENCRYPTION_KEY', hex2bin($env['ENCRYPTION_KEY']));

$params = $_GET['params'] ?? '';

if ($params === 'api/users/profile') {
    require_once 'users/profile.php';
    exit;
}

class Connection
{
    /** @var PDO $conn */
    private static $conn = null;

    public static function connect()
    {
        if (self::$conn === null) {
            $cnString = "mysql:host=" . SERVER . ";dbname=" . DBASE . ";charset=" . CHARSET;
            $options = [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
                \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
                \PDO::ATTR_EMULATE_PREPARES => false,
                \PDO::ATTR_STRINGIFY_FETCHES => false
            ];

            try {
                self::$conn = new \PDO($cnString, USER, PWORD, $options);
            } catch (\PDOException $e) {
                http_response_code(500);
                header('Content-Type: application/json');
                echo json_encode([
                    "success" => false,
                    "message" => "Database connection error."
                ]);
                exit;
            }
        }
        return self::$conn;
    }

    public static function testConnection()
    {
        try {
            $db = self::connect();
            $query = $db->query("SELECT 1");
            return $query !== false;
        } catch (\PDOException $e) {
            return false;
        }
    }
}
