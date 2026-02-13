<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';
require __DIR__ . '/../../engines/matching_engine.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$entrepreneurId = $authUser["uid"];

$projectId = $_GET["project_id"] ?? null;
if (!$projectId) json_response(["success"=>false,"error"=>"Missing project_id"], 400);

$payload = json_decode(file_get_contents("php://input"), true);
if (!is_array($payload)) json_response(["success"=>false,"error"=>"Invalid JSON body"], 400);

$removeIds = $payload["remove_professionals"] ?? [];
$addRoles  = $payload["add_roles"] ?? [];

if (count($removeIds) > 3 || count($addRoles) > 3) {
  json_response(["success"=>false,"error"=>"You can add/remove a maximum of 3 members"], 422);
}

$firestore = new FirestoreService();

// Load project + ownership + unlock
$projSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projSnap->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

$project = $projSnap->data();
if (($project["entrepreneur_id"] ?? "") !== $entrepreneurId) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}
if (!(bool)($project["unlocked"] ?? false)) {
  json_response(["success"=>false,"error"=>"Payment required to modify team"], 403);
}

// Load team doc
$teamSnap = $firestore->collection("project_teams")->document($projectId)->snapshot();
if (!$teamSnap->exists()) json_response(["success"=>false,"error"=>"Team not found"], 404);

$teamDoc = $teamSnap->data();
if (($teamDoc["status"] ?? "draft") !== "draft") {
  json_response(["success"=>false,"error"=>"Team can no longer be modified"], 403);
}

$currentTeam = $teamDoc["team"] ?? [];

// Remove
$currentTeam = array_values(array_filter($currentTeam, function($m) use ($removeIds) {
  $pid = $m["professional_id"] ?? null;
  return $pid && !in_array($pid, $removeIds, true);
}));

$added = [];

if (!empty($addRoles)) {
  // Load approved professionals
  $professionals = [];
  $pros = $firestore->collection("professionals")
    ->where("approved", "=", true)
    ->documents();

  foreach ($pros as $p) {
    $row = $p->data();
    $row["id"] = $p->id();
    $professionals[] = $row;
  }

  $existingIds = array_map(fn($m) => $m["professional_id"] ?? "", $currentTeam);

  foreach ($addRoles as $roleWanted) {
    $filtered = array_values(array_filter($professionals, function($p) use ($roleWanted, $existingIds) {
      return ($p["primary_role"] ?? null) === $roleWanted && !in_array($p["id"], $existingIds, true);
    }));

    if (empty($filtered)) continue;

    $result = MatchingEngine::generateTeam($project, $filtered, 1);
    if (empty($result["team"])) continue;

    $candidate = $result["team"][0]["professional"];
    $existingIds[] = $candidate["id"];

    $currentTeam[] = [
      "professional_id" => $candidate["id"],
      "role" => $roleWanted,
      "score" => $result["team"][0]["score"] ?? null
    ];
    $added[] = $candidate["id"];
  }
}

$firestore->collection("project_teams")->document($projectId)->set([
  "team" => $currentTeam,
  "updated_at" => date("c")
], ["merge" => true]);

json_response([
  "success" => true,
  "removed" => $removeIds,
  "added" => $added,
  "message" => "Team updated"
]);
