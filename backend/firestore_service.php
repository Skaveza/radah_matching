<?php

require __DIR__ . '/bootstrap.php';

use Kreait\Firebase\Factory;

class FirestoreService
{
    private $firestore;

    public function __construct()
    {
        $base64 = $_ENV['FIREBASE_CREDENTIALS_BASE64'] ?? null;

        if (!$base64) {
            throw new Exception("Missing FIREBASE_CREDENTIALS_BASE64 in environment");
        }

        // Decode base64
        $json = base64_decode($base64);

        if (!$json) {
            throw new Exception("Invalid base64 Firebase credentials");
        }

        // Create temporary file
        $tempFile = sys_get_temp_dir() . '/firebase_credentials.json';
        file_put_contents($tempFile, $json);

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
