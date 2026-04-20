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
$user = $mw->verifyToken(["entrepreneur"]);
$uid = $user["uid"];

$body = json_decode(file_get_contents("php://input"), true);

if (!isset($body["project_id"]) || !isset($body["roles"])) {
  json_response(["success"=>false,"error"=>"project_id and roles required"], 400);
}

$projectId = $body["project_id"];
$roles = $body["roles"];

$firestore = new FirestoreService();

// ownership check
$proj = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$proj->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

if (($proj->data()["entrepreneur_id"] ?? "") !== $uid) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}

foreach ($roles as $role) {
  $firestore->collection("team_roles")->add([
    "project_id" => $projectId,
    "role" => $role,
    "status" => "open",
    "selected_professional_id" => null,
    "created_at" => date("c"),
    "updated_at" => date("c"),
  ]);
}

json_response(["success"=>true,"message"=>"Roles created"]);