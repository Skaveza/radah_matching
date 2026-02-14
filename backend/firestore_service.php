<?php
require __DIR__ . '/bootstrap.php';

use Kreait\Firebase\Factory;

class FirestoreService
{
    private $firestore;

    public function __construct()
    {
        /**
         * Render-safe credential loading:
         * Priority:
         * 1) FIREBASE_CREDENTIALS_PATH (if you truly have a file on disk)
         * 2) FIREBASE_SERVICE_ACCOUNT_JSON (env var containing JSON string)
         * 3) FIREBASE_SERVICE_ACCOUNT_BASE64 (env var containing base64(JSON))
         */

        $credentialsPath = $_ENV['FIREBASE_CREDENTIALS_PATH'] ?? getenv('FIREBASE_CREDENTIALS_PATH');

        $serviceJson = $_ENV['FIREBASE_SERVICE_ACCOUNT_JSON'] ?? getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
        $serviceB64  = $_ENV['FIREBASE_SERVICE_ACCOUNT_BASE64'] ?? getenv('FIREBASE_SERVICE_ACCOUNT_BASE64');

        // If a path is provided and exists, use it
        if ($credentialsPath && file_exists($credentialsPath)) {
            $factory = (new Factory)->withServiceAccount($credentialsPath);
            $this->firestore = $factory->createFirestore()->database();
            return;
        }

        // If JSON is provided, write to temp file and use it
        if ($serviceJson && is_string($serviceJson)) {
            $tmp = $this->writeTempServiceAccount($serviceJson);
            $factory = (new Factory)->withServiceAccount($tmp);
            $this->firestore = $factory->createFirestore()->database();
            return;
        }

        // If base64 JSON is provided, decode then write temp file
        if ($serviceB64 && is_string($serviceB64)) {
            $decoded = base64_decode($serviceB64, true);
            if (!$decoded) {
                throw new \Exception("FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64.");
            }
            $tmp = $this->writeTempServiceAccount($decoded);
            $factory = (new Factory)->withServiceAccount($tmp);
            $this->firestore = $factory->createFirestore()->database();
            return;
        }

        // Nothing worked
        throw new \Exception(
            "Firebase credentials missing. Set ONE of: " .
            "FIREBASE_CREDENTIALS_PATH (file on server) OR FIREBASE_SERVICE_ACCOUNT_JSON OR FIREBASE_SERVICE_ACCOUNT_BASE64."
        );
    }

    private function writeTempServiceAccount(string $json): string
    {
        // basic validation so we fail early
        $data = json_decode($json, true);
        if (!is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            throw new \Exception("Service account JSON looks invalid (missing client_email/private_key).");
        }

        $dir = sys_get_temp_dir();
        $file = $dir . '/firebase_sa_' . sha1($data['client_email']) . '.json';

        // Write once (keeps stable path for reuse)
        if (!file_exists($file)) {
            file_put_contents($file, $json);
            @chmod($file, 0600);
        }

        return $file;
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
