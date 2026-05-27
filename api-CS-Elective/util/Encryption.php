<?php
class EncryptionHandler {
    private static function get_key() {
        return ENCRYPTION_KEY;
    }

    public static function encrypt($data) {
        if (empty($data)) return null;
        $iv = openssl_random_pseudo_bytes(12);
        $tag = ""; 
        $ciphertext = openssl_encrypt($data, 'aes-256-gcm', self::get_key(), OPENSSL_RAW_DATA, $iv, $tag);
        
        return [
            'data' => base64_encode($ciphertext),
            'iv' => base64_encode($iv),
            'tag' => base64_encode($tag)
        ];
    }

    public static function decrypt($cipherText, $iv, $tag) {
        if (!$cipherText || !$iv || !$tag) return null;
        $decrypted = openssl_decrypt(
            base64_decode($cipherText), 
            'aes-256-gcm', 
            self::get_key(), 
            OPENSSL_RAW_DATA, 
            base64_decode($iv), 
            base64_decode($tag)
        );
        return $decrypted ?: null;
    }
}