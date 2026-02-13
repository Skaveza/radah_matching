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

/**
 * This file is mounted by your router as:
 * POST /api/projects/{id}/team/save
 * So we take $id (projectId) from the URL.
 */
$projectId = $id ?? null; // <-- comes from index.php route handler fn($id)
if (!$projectId) {
  json_response(["success" => false, "error" => "Missing project id in URL"], 400);
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$entrepreneurId = $authUser["uid"];

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body) || !isset($body["team"])) {
  json_response(["success" => false, "error" => "team is required"], 400);
}

$team = $body["team"];
$firestore = new FirestoreService();

// Load project + ownership check
$projSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projSnap->exists()) json_response(["success" => false, "error" => "Project not found"], 404);

$project = $projSnap->data();
if (($project["entrepreneur_id"] ?? "") !== $entrepreneurId) {
  json_response(["success" => false, "error" => "Forbidden"], 403);
}

// Save team under project_teams/{projectId}
$firestore->collection("project_teams")->document($projectId)->set([
  "project_id" => $projectId,
  "entrepreneur_id" => $entrepreneurId,
  "team" => $team,

  // You can use these flags in UI logic
  "locked" => true,
  "status" => "saved",

  "updated_at" => date("c"),
], ["merge" => true]);

// Optional: also mark project as having a team saved
$firestore->collection("projects")->document($projectId)->set([
  "team_saved" => true,
  "updated_at" => date("c"),
], ["merge" => true]);

json_response([
  "success" => true,
  "message" => "Team saved",
  "project_id" => $projectId
]);
