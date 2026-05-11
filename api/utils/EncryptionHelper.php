<?php
define('AES_256_KEY', 'my-super-secret-32-byte-key-123!');

class EncryptionHelper {
    public static function encrypt($data) {
        $iv = openssl_random_pseudo_bytes(12);
        $tag = ""; 
        $ciphertext = openssl_encrypt($data, 'aes-256-gcm', AES_256_KEY, OPENSSL_RAW_DATA, $iv, $tag);
        return [
            'ciphertext' => base64_encode($ciphertext),
            'iv' => base64_encode($iv),
            'tag' => base64_encode($tag)
        ];
    }

    public static function decrypt($cipherText, $iv, $tag) {
        $rawCiphertext = base64_decode($cipherText);
        $rawIv = base64_decode($iv);
        $rawTag = base64_decode($tag);
        
        $decrypted = openssl_decrypt($rawCiphertext, 'aes-256-gcm', AES_256_KEY, OPENSSL_RAW_DATA, $rawIv, $rawTag);
        return $decrypted;
    }
}
?>