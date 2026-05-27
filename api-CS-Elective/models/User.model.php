<?php
class User
{
    private \PDO $pdo;

    public function __construct(\PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function getProfile(int $userId): array
    {
        $result = execQuery("SELECT * FROM users WHERE id = ?", [$userId], $this->pdo);

        if ($result['success'] && !empty($result['data'])) {
            $user = &$result['data'][0];

            if (!empty($user['phone_number']) && !empty($user['phone_iv']) && !empty($user['phone_tag'])) {
                $user['phone_number'] = EncryptionHandler::decrypt($user['phone_number'], $user['phone_iv'], $user['phone_tag']);
            }
            if (!empty($user['address']) && !empty($user['address_iv']) && !empty($user['address_tag'])) {
                $user['address'] = EncryptionHandler::decrypt($user['address'], $user['address_iv'], $user['address_tag']);
            }

            unset($user['phone_iv'], $user['phone_tag'], $user['address_iv'], $user['address_tag'], $user['password']);

            if (isset($user['payment_methods'])) {
                $user['payment_methods'] = json_decode($user['payment_methods'] ?? '[]');
            }
        }

        return $result;
    }

    public function updateProfile(object $dt): array
    {

        $rawPhone = $dt->phone_number ?? '';
        $rawAddress = $dt->address ?? '';

        $phone = EncryptionHandler::encrypt($rawPhone);
        $address = EncryptionHandler::encrypt($rawAddress);

        $p_cipher = $phone ? ($phone['data'] ?? '') : '';
        $p_iv     = $phone ? ($phone['iv'] ?? '') : '';
        $p_tag    = $phone ? ($phone['tag'] ?? '') : '';

        $a_cipher = $address ? ($address['data'] ?? '') : '';
        $a_iv     = $address ? ($address['iv'] ?? '') : '';
        $a_tag    = $address ? ($address['tag'] ?? '') : '';

        $userId = $dt->user_id ?? 0;

        $values = [
            $userId,
            $dt->username ?? '',
            $dt->full_name ?? '',
            $p_cipher,
            $p_iv,
            $p_tag,
            $dt->date_of_birth ?? '2000-01-01',
            $a_cipher,
            $a_iv,
            $a_tag,
            $dt->country ?? '',
            $dt->gender ?? 'Male',
            $dt->profile_picture ?? '',
            is_string($dt->payment_methods) ? $dt->payment_methods : json_encode($dt->payment_methods ?? [])
        ];

        return execQuery("CALL UpdateUserProfile(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", $values, $this->pdo);
    }
}
