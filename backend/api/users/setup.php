<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken();
$uid = $authUser["uid"];
$email = trim($authUser["email"] ?? "");

if ($email === "") {
  json_response(["success" => false, "error" => "Missing email (Firebase user email not found)"], 422);
}

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success" => false, "error" => "Invalid JSON"], 400);

$role = trim($body["role"] ?? "");
if ($role === "") json_response(["success" => false, "error" => "Missing field: role"], 422);

if (!in_array($role, ["entrepreneur", "professional"], true)) {
  json_response(["success" => false, "error" => "Invalid role"], 422);
}

$firestore = new FirestoreService();
$userRef = $firestore->collection("users")->document($uid);

// don’t reset stuff if role already set
$snap = $userRef->snapshot();
$current = $snap->exists() ? $snap->data() : [];
if (!empty($current["role"])) {
  json_response([
    "success" => true,
    "message" => "Role already set",
    "uid" => $uid,
    "role" => $current["role"],
  ]);
}

$update = [
  "uid" => $uid,
  "email" => $email,
  "role" => $role,
  "updated_at" => date("c"),
];

// if user doc doesn’t exist yet, create minimal one
if (!$snap->exists()) {
  $update["created_at"] = date("c");
}

if ($role === "entrepreneur") {
  $update["projects_created"] = 0;
  $update["max_projects"] = 1;
  $update["plan"] = "starter";
  $update["payment_status"] = "inactive";
}

if ($role === "professional") {
  $update["professional_status"] = "pending";
}

$userRef->set($update, ["merge" => true]);

if ($role === "professional") {
  $proRef = $firestore->collection("professionals")->document($uid);
  $proRef->set([
    "uid" => $uid,
    "email" => $email,
    "approved" => false,
    "status" => "pending",
    "created_at" => date("c"),
    "updated_at" => date("c"),
  ], ["merge" => true]);
}

json_response(["success" => true, "message" => "Role saved", "uid" => $uid, "role" => $role]);
