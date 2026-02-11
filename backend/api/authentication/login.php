<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firebase_admin.php';

header("Content-Type: application/json");

$input = json_decode(file_get_contents("php://input"), true);
if (!$input) {
    http_response_code(400); echo json_encode(["success"=>false,"error"=>"Invalid JSON"]); exit;
}

$email = $input["email"] ?? "";
$password = $input["password"] ?? "";
$role = $input["role"] ?? "";

if (!$email || !$password || !$role) {
    http_response_code(422); echo json_encode(["success"=>false,"error"=>"Missing fields"]); exit;
}

// Authenticate using Firebase
try {
    $idToken = FirebaseAdmin::signInWithEmailAndPassword($email, $password);

    $user = FirebaseAdmin::verifyIdToken($idToken);

    // Ensure role matches
    if (($user->claims->role ?? "") !== $role) {
        http_response_code(403); echo json_encode(["success"=>false,"error"=>"Invalid role"]); exit;
    }

    json_response([
        "success" => true,
        "token" => $idToken,
        "user" => [
            "uid" => $user->uid,
            "email" => $user->email,
            "role" => $user->claims->role ?? "",
            "region" => $user->claims->region ?? ""
        ]
    ]);
} catch (Exception $e) {
    http_response_code(401); echo json_response(["success"=>false,"error"=>"Invalid credentials", "details"=>$e->getMessage()], 401);
}