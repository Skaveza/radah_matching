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
$authUser = $mw->verifyToken(["entrepreneur"]);
$entrepreneurId = $authUser["uid"];

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

$required = ["project_id", "professional_id"];
foreach ($required as $f) {
  if (!isset($body[$f]) || trim((string)$body[$f]) === "") {
    json_response(["success"=>false,"error"=>"Missing field: $f"], 422);
  }
}

$projectId = trim($body["project_id"]);
$professionalId = trim($body["professional_id"]);
$role = trim($body["role"] ?? "member");

$firestore = new FirestoreService();

// Load project
$projSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projSnap->exists()) {
  json_response(["success"=>false,"error"=>"Project not found"], 404);
}

$project = $projSnap->data();

// Ownership check
if (($project["entrepreneur_id"] ?? "") !== $entrepreneurId) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}

// Subscription gate (your Stripe SaaS model)
if (!(bool)($project["unlocked"] ?? false)) {
  json_response(["success"=>false,"error"=>"Subscription required"], 403);
}

// Create invite (IMPORTANT: explicit external payment model)
$ref = $firestore->collection("project_team_members")->add([
  "project_id" => $projectId,
  "team_id" => $projectId,
  "professional_id" => $professionalId,
  "entrepreneur_id" => $entrepreneurId,
  "role" => $role,

  "status" => "invited",
  "contract_type" => "external",   // 🔥 KEY ADDITION
  "payment_mode" => "off_platform",

  "created_at" => date("c"),
  "updated_at" => date("c"),
]);

json_response([
  "success" => true,
  "team_member_id" => $ref->id(),
  "status" => "invited"
]);