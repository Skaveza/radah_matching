<?php

require __DIR__ . '/bootstrap.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Exception\FirebaseException;

class FirestoreService
{
    private $firestore;

    public function __construct()
    {
        $credentialsPath = $_ENV['FIREBASE_CREDENTIALS_PATH'] ?? null;

        if (!$credentialsPath || !file_exists($credentialsPath)) {
            throw new Exception("Missing or invalid FIREBASE_CREDENTIALS_PATH in .env");
        }

        $factory = (new Factory)->withServiceAccount($credentialsPath);

        // Firestore instance
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
