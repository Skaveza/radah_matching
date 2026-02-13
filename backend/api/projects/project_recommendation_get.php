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

function maskProfessional(array $p): array {
  unset($p["email"], $p["phone"], $p["linkedin"]);
  return $p;
}

/**
 * IMPORTANT: $id comes from index.php route:
 * GET /api/projects/{id}/recommendation
 */
$projectId = $id ?? null;
if (!$projectId) json_response(["success"=>false,"error"=>"Missing project id"], 400);

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$entrepreneurId = $authUser["uid"];

$firestore = new FirestoreService();

// 1) Load project + ownership
$projectSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projectSnap->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

$project = $projectSnap->data();
if (($project["entrepreneur_id"] ?? "") !== $entrepreneurId) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}

$unlocked = (bool)($project["unlocked"] ?? false);

// 2) Get recommendations doc (doc id = projectId)
$recSnap = $firestore->collection("project_recommendations")->document($projectId)->snapshot();
$recommendations = $recSnap->exists() ? ($recSnap->data()["recommendations"] ?? null) : null;

// 3) Get team doc (doc id = projectId)
$teamSnap = $firestore->collection("project_teams")->document($projectId)->snapshot();
$teamDoc = $teamSnap->exists() ? $teamSnap->data() : null;

$team = $teamDoc["team"] ?? [];
$locked = (bool)($teamDoc["locked"] ?? true);

// If NOT unlocked, ensure team is masked
if (!$unlocked) {
  // Your team entries may contain nested "professional" object (depending on MatchingEngine output)
  $team = array_map(function($member) {
    if (isset($member["professional"]) && is_array($member["professional"])) {
      $member["professional"] = maskProfessional($member["professional"]);
    }
    return $member;
  }, $team);
}

json_response([
  "success" => true,
  "project_id" => $projectId,
  "project" => $project,
  "recommendations" => $recommendations,
  "team" => $team,
  "locked" => $locked,
  "unlocked" => $unlocked
]);
