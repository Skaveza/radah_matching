<?php
// firebase_middleware.php
require __DIR__ . '/vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth;

class FirebaseMiddleware
{
    private Auth $auth;

    public function __construct()
    {
        // Initialize Firebase Admin
        $factory = (new Factory)->withServiceAccount(__DIR__.'/firebase-service-account.json');
        $this->auth = $factory->createAuth();
    }

    /**
     * Verify Firebase ID token from Authorization header
     * @param array $allowedRoles Optional list of roles allowed for this endpoint
     * @return array user data if valid
     */
    public function verifyToken(array $allowedRoles = []): array
    {
        // Check Authorization header
        $headers = getallheaders();
        if (!isset($headers['Authorization'])) {
            $this->forbidden('Missing Authorization header');
        }

        $authHeader = $headers['Authorization'];
        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $this->forbidden('Invalid Authorization header format');
        }

        $idToken = $matches[1];

        try {
            $verifiedToken = $this->auth->verifyIdToken($idToken);
        } catch (\Kreait\Firebase\Exception\Auth\FailedToVerifyToken $e) {
            $this->forbidden('Invalid or expired token: ' . $e->getMessage());
        }

        $uid = $verifiedToken->claims()->get('sub');
        $user = $this->auth->getUser($uid);

        // Extract custom claims if set
        $customClaims = $user->customClaims ?? [];
        $role = $customClaims['role'] ?? null;
        $region = $customClaims['region'] ?? null;

        if (!empty($allowedRoles) && !in_array($role, $allowedRoles, true)) {
            $this->forbidden('Insufficient permissions for this resource');
        }

        return [
            'uid' => $uid,
            'email' => $user->email,
            'role' => $role,
            'region' => $region,
            'firebaseUser' => $user
        ];
    }

    private function forbidden(string $message)
    {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'error' => $message
        ], JSON_PRETTY_PRINT);
        exit;
    }
}