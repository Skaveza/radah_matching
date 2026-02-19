<?php
require_once __DIR__ . '/vendor/autoload.php';
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

        $json = base64_decode($base64, true);
        if ($json === false || $json === "") {
            throw new Exception("Invalid base64 Firebase credentials");
        }

        $data = json_decode($json, true);
        if (!is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            throw new Exception("Decoded Firebase credentials JSON is invalid (missing client_email/private_key)");
        }

        $tempFile = sys_get_temp_dir() . '/firebase_credentials_' . sha1($data['client_email']) . '.json';
        if (!file_exists($tempFile)) {
            file_put_contents($tempFile, $json);
            @chmod($tempFile, 0600);
        }

        $this->firestore = new \Google\Cloud\Firestore\FirestoreClient([
            'projectId' => $data['project_id'],
            'keyFilePath' => $tempFile,
            'transport' => 'rest',
        ]);
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