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
        $credentialsPath = $_ENV['FIREBASE_CREDENTIALS_PATH'] ?? null;

        if (!$credentialsPath || !file_exists($credentialsPath)) {
            $this->forbidden("Missing FIREBASE_CREDENTIALS_PATH");
        }

        $factory = (new Factory)->withServiceAccount($credentialsPath);
        $this->auth = $factory->createAuth();
    }

    /**
     * Verify token + (optionally) require user profile in Firestore.
     *
     * Usage:
     *  - $mw->verifyToken(); // only verifies token, userDoc may be []
     *  - $mw->verifyToken(["admin"]); // verifies token, requires role + profile
     *  - $mw->verifyToken([], true); // verifies token, requires profile (role may be null)
     */
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

        // Read Firebase user info (helpful for setup)
        $email = null;
        $name = null;
        try {
            $fbUser = $this->auth->getUser($uid);
            $email = $fbUser->email ?? null;
            $name = $fbUser->displayName ?? null;
        } catch (\Throwable $e) {
            // Ignore if user lookup fails
        }

        // Fetch Firestore profile if exists (DO NOT fail if missing unless required)
        $firestore = new FirestoreService();
        $userDoc = [];
        $role = null;

        try {
            $snap = $firestore->collection("users")->document($uid)->snapshot();
            if ($snap && $snap->exists()) {
                $userDoc = $snap->data();
                $role = $userDoc["role"] ?? null;
            }
        } catch (\Throwable $e) {
            // If Firestore is temporarily failing, we still allow token validation
            $userDoc = [];
            $role = null;
        }

        // If endpoint requires profile, enforce it
        if ($requireProfile && empty($userDoc)) {
            $this->forbidden("User profile not found");
        }

        // If endpoint requires role(s), enforce role existence + allowed roles
        if (!empty($allowedRoles)) {
            if (!$role) {
                $this->forbidden("User role missing");
            }
            if (!in_array($role, $allowedRoles, true)) {
                $this->forbidden("Insufficient permissions");
            }
        }

        return [
            "uid" => $uid,
            "role" => $role,     // can be null if profile not set yet
            "userDoc" => $userDoc, // can be [] if profile not set yet
            "email" => $email,
            "name" => $name,
        ];
    }

    private function getAuthorizationHeader(): string
    {
        // Works in Apache + Nginx + PHP built-in server
        $headers = function_exists("getallheaders") ? getallheaders() : [];
        $auth = $headers["Authorization"] ?? $headers["authorization"] ?? null;

        if (!$auth && isset($_SERVER["HTTP_AUTHORIZATION"])) {
            $auth = $_SERVER["HTTP_AUTHORIZATION"];
        }
        if (!$auth && isset($_SERVER["REDIRECT_HTTP_AUTHORIZATION"])) {
            $auth = $_SERVER["REDIRECT_HTTP_AUTHORIZATION"];
        }

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
}
