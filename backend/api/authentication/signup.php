<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firebase_admin.php'; // Firebase Admin SDK wrapper
require __DIR__ . '/validators.php';
require __DIR__ . '/enums.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    json_response(["success" => false, "error" => "Invalid JSON"], 400);
}

// Required fields
$required = ["name", "email", "password", "role", "region"];
$missing = Validators::required($input, $required);
if ($missing) {
    json_response(["success" => false, "error" => "Missing fields", "missing" => $missing], 422);
}

// Validate role
if (!in_array($input["role"], ["entrepreneur", "professional"])) {
    json_response(["success" => false, "error" => "Invalid role"], 422);
}

// Validate email
if (!Validators::isValidEmail($input["email"])) {
    json_response(["success" => false, "error" => "Invalid email"], 422);
}

// Check if user exists
$existing = FirebaseAdmin::getUserByEmail($input["email"]);
if ($existing) {
    json_response(["success" => false, "error" => "Email already exists"], 409);
}

// Create user
try {
    $customClaims = [
        "role" => $input["role"],
        "region" => $input["region"]
    ];

    $userRecord = FirebaseAdmin::createUser([
        "email" => $input["email"],
        "password" => $input["password"],
        "displayName" => $input["name"],
        "customClaims" => $customClaims
    ]);

    // Optional: store additional fields in Firestore
    FirebaseAdmin::firestore()->collection("users")->document($userRecord->uid)->set([
        "name" => $input["name"],
        "role" => $input["role"],
        "region" => $input["region"],
        "plan" => $input["role"] === "entrepreneur" ? "free" : null,
        "projects_created" => 0,
        "payment_status" => "inactive",
        "created_at" => date("c")
    ]);

    json_response(["success" => true, "message" => "User created", "uid" => $userRecord->uid]);
} catch (Exception $e) {
    json_response(["success" => false, "error" => "Server error", "details" => $e->getMessage()], 500);
}