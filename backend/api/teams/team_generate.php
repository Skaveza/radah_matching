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

// $id comes from index.php route: /api/projects/{id}/team/generate
$projectId = isset($id) ? trim($id) : "";

// Fallback (optional): allow body project_id if route didn't pass
if ($projectId === "") {
  $body = json_decode(file_get_contents("php://input"), true);
  if (is_array($body) && !empty($body["project_id"])) {
    $projectId = trim($body["project_id"]);
  }
}

if ($projectId === "") {
  json_response(["success"=>false,"error"=>"Project id is required"], 400);
}

$firestore = new FirestoreService();

// Load project
$projectSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projectSnap->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

$project = $projectSnap->data();

// Ownership check
if (($project["entrepreneur_id"] ?? "") !== $entrepreneurId) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}

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

if (empty($professionals)) {
  json_response(["success"=>false,"error"=>"No approved professionals available"], 400);
}

// Generate team
$result = MatchingEngine::generateTeam($project, $professionals, 4);

json_response([
  "success" => true,
  "project_id" => $projectId,
  "team" => $result["team"],
  "project_signals" => $result["project_signals"] ?? null
]);
