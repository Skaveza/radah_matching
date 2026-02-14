<?php
require __DIR__ . '/../../vendor/autoload.php';
require_once __DIR__ . '/../../firestore_service.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

class FirebaseMiddlewareV2
{
    private Auth $auth;

    public function __construct()
    {
        /**
         * Render-safe credential loading:
         * Priority:
         * 1) FIREBASE_CREDENTIALS_PATH (file exists on server)
         * 2) FIREBASE_SERVICE_ACCOUNT_JSON (raw JSON string)
         * 3) FIREBASE_SERVICE_ACCOUNT_BASE64 (base64(JSON))
         */

        $credentialsPath = $_ENV['FIREBASE_CREDENTIALS_PATH'] ?? getenv('FIREBASE_CREDENTIALS_PATH');
        $serviceJson     = $_ENV['FIREBASE_SERVICE_ACCOUNT_JSON'] ?? getenv('FIREBASE_SERVICE_ACCOUNT_JSON');
        $serviceB64      = $_ENV['FIREBASE_SERVICE_ACCOUNT_BASE64'] ?? getenv('FIREBASE_SERVICE_ACCOUNT_BASE64');

        // 1) Use file path if it exists
        if ($credentialsPath && file_exists($credentialsPath)) {
            $factory = (new Factory)->withServiceAccount($credentialsPath);
            $this->auth = $factory->createAuth();
            return;
        }

        // 2) Use JSON env var (write temp file)
        if ($serviceJson && is_string($serviceJson)) {
            $tmp = $this->writeTempServiceAccount($serviceJson);
            $factory = (new Factory)->withServiceAccount($tmp);
            $this->auth = $factory->createAuth();
            return;
        }

        // 3) Use base64 env var (decode -> write temp file)
        if ($serviceB64 && is_string($serviceB64)) {
            $decoded = base64_decode($serviceB64, true);
            if (!$decoded) {
                $this->serverError("FIREBASE_SERVICE_ACCOUNT_BASE64 is not valid base64.");
            }
            $tmp = $this->writeTempServiceAccount($decoded);
            $factory = (new Factory)->withServiceAccount($tmp);
            $this->auth = $factory->createAuth();
            return;
        }

        $this->serverError(
            "Firebase credentials missing. Set ONE of: " .
            "FIREBASE_CREDENTIALS_PATH (file on server) OR FIREBASE_SERVICE_ACCOUNT_JSON OR FIREBASE_SERVICE_ACCOUNT_BASE64."
        );
    }

    public function verifyToken(array $allowedRoles = [], bool $requireProfile = false): array
    {
        $authHeader = $this->getAuthorizationHeader();

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $m)) {
            $this->unauthorized("Missing/invalid Authorization header");
        }

        $idToken = $m[1];

        try {
            $verifiedToken = $this->auth->verifyIdToken($idToken);
        } catch (\Throwable $e) {
            $this->unauthorized("Invalid or expired token");
        }

        $uid = $verifiedToken->claims()->get('sub');

        // Firebase user info (optional)
        $email = null;
        $name  = null;
        try {
            $fbUser = $this->auth->getUser($uid);
            $email = $fbUser->email ?? null;
            $name  = $fbUser->displayName ?? null;
        } catch (\Throwable $e) {
            // ignore
        }

        $firestore = new FirestoreService();
        $userDoc = [];
        $role = null;

        // Fetch Firestore profile if exists
        try {
            $snap = $firestore->collection("users")->document($uid)->snapshot();
            if ($snap && $snap->exists()) {
                $userDoc = $snap->data();
                $role = $userDoc["role"] ?? null;
            }
        } catch (\Throwable $e) {
            $userDoc = [];
            $role = null;
        }

        // Auto-admin promotion based on env allow-list (secure)
        // Set ADMIN_EMAILS in .env like: ADMIN_EMAILS=admin@gmail.com,admin2@domain.com
        if (empty($userDoc) && $email && $this->isAdminEmail($email)) {
            $profile = [
                "uid" => $uid,
                "email" => $email,
                "name" => $name,
                "role" => "admin",
                "created_at" => date("c"),
                "updated_at" => date("c"),
                "payment_status" => "not_required",
                "plan" => "admin"
            ];

            try {
                $firestore->collection("users")->document($uid)->set($profile);
                $userDoc = $profile;
                $role = "admin";
            } catch (\Throwable $e) {
                // If write fails, still allow token verification, but role stays null
            }
        }

        if ($requireProfile && empty($userDoc)) {
            $this->forbidden("User profile not found");
        }

        if (!empty($allowedRoles)) {
            if (!$role) $this->forbidden("User role missing");
            if (!in_array($role, $allowedRoles, true)) {
                $this->forbidden("Insufficient permissions");
            }
        }

        return [
            "uid" => $uid,
            "role" => $role,
            "userDoc" => $userDoc,
            "email" => $email,
            "name" => $name,
        ];
    }

    private function writeTempServiceAccount(string $json): string
    {
        $data = json_decode($json, true);
        if (!is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            $this->serverError("Service account JSON looks invalid (missing client_email/private_key).");
        }

        $dir = sys_get_temp_dir();
        $file = $dir . '/firebase_sa_' . sha1($data['client_email']) . '.json';

        if (!file_exists($file)) {
            file_put_contents($file, $json);
            @chmod($file, 0600);
        }

        return $file;
    }

    private function isAdminEmail(string $email): bool
    {
        $raw = $_ENV["ADMIN_EMAILS"] ?? getenv("ADMIN_EMAILS") ?? "";
        if (!$raw) return false;

        $allowed = array_values(array_filter(array_map("trim", explode(",", $raw))));
        $emailLower = strtolower(trim($email));

        foreach ($allowed as $a) {
            if ($a !== "" && strtolower($a) === $emailLower) return true;
        }
        return false;
    }

    private function getAuthorizationHeader(): string
    {
        $headers = function_exists("getallheaders") ? getallheaders() : [];
        $auth = $headers["Authorization"] ?? $headers["authorization"] ?? null;

        if (!$auth && isset($_SERVER["HTTP_AUTHORIZATION"])) $auth = $_SERVER["HTTP_AUTHORIZATION"];
        if (!$auth && isset($_SERVER["REDIRECT_HTTP_AUTHORIZATION"])) $auth = $_SERVER["REDIRECT_HTTP_AUTHORIZATION"];

        return $auth ?? "";
    }

    private function unauthorized(string $msg): void
    {
        http_response_code(401);
        header("Content-Type: application/json");
        echo json_encode(["success" => false, "error" => $msg], JSON_PRETTY_PRINT);
        exit;
    }

    private function forbidden(string $msg): void
    {
        http_response_code(403);
        header("Content-Type: application/json");
        echo json_encode(["success" => false, "error" => $msg], JSON_PRETTY_PRINT);
        exit;
    }

    private function serverError(string $msg): void
    {
        http_response_code(500);
        header("Content-Type: application/json");
        echo json_encode(["success" => false, "error" => $msg], JSON_PRETTY_PRINT);
        exit;
    }
}
