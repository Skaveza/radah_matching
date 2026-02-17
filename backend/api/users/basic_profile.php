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
$authUser = $mw->verifyToken(); // logged-in user
$uid = $authUser["uid"];
$email = trim($authUser["email"] ?? "");

if ($email === "") {
  json_response(["success" => false, "error" => "Missing email (Firebase user email not found)"], 422);
}

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success" => false, "error" => "Invalid JSON"], 400);

$name = trim($body["name"] ?? "");
$region = trim($body["region"] ?? "");

if ($name === "" || $region === "") {
  json_response(["success" => false, "error" => "Missing fields: name,region"], 422);
}

$firestore = new FirestoreService();
$userRef = $firestore->collection("users")->document($uid);

$snap = $userRef->snapshot();
$isNew = !$snap->exists();

$update = [
  "uid" => $uid,
  "email" => $email,
  "name" => $name,
  "region" => $region,
  "updated_at" => date("c"),
];

if ($isNew) {
  $update["created_at"] = date("c");
}

$userRef->set($update, ["merge" => true]);

json_response([
  "success" => true,
  "message" => "Basic profile saved",
  "uid" => $uid
]);
