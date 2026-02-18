<?php

require __DIR__ . '/bootstrap.php';

use Kreait\Firebase\Factory;

class FirestoreService
{
    private $firestore;

    public function __construct()
    {
        $base64 = $_ENV['FIREBASE_CREDENTIALS_BASE64'] ?? getenv('FIREBASE_CREDENTIALS_BASE64');

        if (!$base64) {
            throw new Exception("Missing FIREBASE_CREDENTIALS_BASE64 in environment");
        }

        // Strict base64 decode
        $json = base64_decode($base64, true);
        if ($json === false || $json === "") {
            throw new Exception("Invalid base64 Firebase credentials");
        }

        // Validate JSON quickly
        $data = json_decode($json, true);
        if (!is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            throw new Exception("Decoded Firebase credentials JSON is invalid (missing client_email/private_key)");
        }

        // Unique temp file per credential set (avoid race conditions)
        $tempFile = sys_get_temp_dir() . '/firebase_credentials_' . sha1($data['client_email']) . '.json';

        if (!file_exists($tempFile)) {
            file_put_contents($tempFile, $json);
            @chmod($tempFile, 0600);
        }

        $factory = (new Factory)->withServiceAccount($tempFile);
        $this->firestore = $factory->createFirestore()->database();
    }

    public function db()
    {
        return $this->firestore;
    }

    public function collection(string $name)
    {
        return $this->firestore->collection($name);
    }
}
