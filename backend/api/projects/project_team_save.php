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

$projectId = $id ?? null;
if (!$projectId) {
  json_response(["success" => false, "error" => "Missing project id"], 400);
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$entrepreneurId = $authUser["uid"];

$body = json_decode(file_get_contents("php://input"), true);
if (!isset($body["team"])) {
  json_response(["success" => false, "error" => "team is required"], 400);
}

$team = $body["team"];
$firestore = new FirestoreService();

// Validate project ownership
$projSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projSnap->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

$project = $projSnap->data();
if (($project["entrepreneur_id"] ?? "") !== $entrepreneurId) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}

// Save raw team
$firestore->collection("project_teams")->document($projectId)->set([
  "project_id" => $projectId,
  "entrepreneur_id" => $entrepreneurId,
  "team" => $team,
  "locked" => true,
  "status" => "saved",
  "updated_at" => date("c"),
], ["merge" => true]);

// 🔥 NEW: create team_members
foreach ($team as $member) {
  $p = $member["professional"] ?? null;
  if (!$p) continue;

  $firestore->collection("team_members")->add([
    "project_id" => $projectId,
    "professional_id" => $p["id"] ?? null,
    "name" => $p["name"] ?? null,
    "role_title" => $p["primary_role"] ?? null,
    "email" => $p["email"] ?? null,
    "status" => "active",
    "created_at" => date("c"),
    "updated_at" => date("c"),
  ]);
}

// Mark project
$firestore->collection("projects")->document($projectId)->set([
  "team_saved" => true,
  "updated_at" => date("c"),
], ["merge" => true]);

json_response([
  "success" => true,
  "message" => "Team saved & members created",
]);