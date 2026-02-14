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
        // Option 2: Base64 credentials from Render env
        $base64 = $_ENV['FIREBASE_CREDENTIALS_BASE64'] ?? getenv('FIREBASE_CREDENTIALS_BASE64');

        if (!$base64) {
            $this->serverError("Missing FIREBASE_CREDENTIALS_BASE64");
        }

        $json = base64_decode($base64, true);
        if (!$json) {
            $this->serverError("Invalid FIREBASE_CREDENTIALS_BASE64 (not valid base64)");
        }

        // Validate JSON structure quickly
        $data = json_decode($json, true);
        if (!is_array($data) || empty($data['client_email']) || empty($data['private_key'])) {
            $this->serverError("Decoded Firebase credentials JSON is invalid (missing client_email/private_key)");
        }

        // Write temp credentials file (Render-safe)
        $tempFile = sys_get_temp_dir() . '/firebase_credentials_' . sha1($data['client_email']) . '.json';
        if (!file_exists($tempFile)) {
            file_put_contents($tempFile, $json);
            @chmod($tempFile, 0600);
        }

        $factory = (new Factory)->withServiceAccount($tempFile);
        $this->auth = $factory->createAuth();
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
        if (empty($userDoc) && $email && $this->isAdminEmail($email)) {
            $profile = [
                "uid" => $uid,
                "email" => $email,
                "name" => $name,
                "role" => "admin",
                "created_at" => date("c"),
                "updated_at" => date("c"),
                "payment_status" => "not_required",
                "plan" => "admin",
            ];

            try {
                $firestore->collection("users")->document($uid)->set($profile);
                $userDoc = $profile;
                $role = "admin";
            } catch (\Throwable $e) {
                // ignore
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
