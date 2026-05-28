<?php
class Auth
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function register(object $dt): array
    {
        if (!isset($dt->username) || !isset($dt->email) || !isset($dt->password)) {
            return ["success" => false, "message" => "Missing required fields", "status" => 400];
        }

        $hashedPassword = password_hash($dt->password, PASSWORD_BCRYPT);
        $result = execQuery("CALL AuthRegister(?, ?, ?)", [$dt->username, $dt->email, $hashedPassword], $this->pdo);

        if ($result['success']) {
            $result['message'] = "User registered successfully";
        }
        return $result;
    }

    public function login(object $dt): array
    {
        $result = execQuery("CALL AuthLogin(?)", [$dt->email], $this->pdo);

        if ($result['success'] && !empty($result['data'])) {
            $user = $result['data'][0];
            if (password_verify($dt->password, $user['password'])) {
                session_regenerate_id(true);
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];

                return ["success" => true, "message" => "Login successful", "user_id" => $user['id']];
            }
        }
        return ["success" => false, "message" => "Invalid credentials"];
    }

    public function logout(): array
    {
        $_SESSION = [];

        if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 42000,
                $params["path"],
                $params["domain"],
                $params["secure"],
                $params["httponly"]
            );
        }

        session_destroy();
        return ["success" => true, "message" => "Logged out successfully"];
    }
}
