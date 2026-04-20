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
$mw->verifyToken(["entrepreneur"]);

$projectId = $_GET["project_id"] ?? null;
if (!$projectId) {
  json_response(["success"=>false,"error"=>"project_id required"], 400);
}

$firestore = new FirestoreService();

$docs = $firestore->collection("team_members")
  ->where("project_id", "=", $projectId)
  ->documents();

$members = [];
foreach ($docs as $doc) {
  if (!$doc->exists()) continue;
  $row = $doc->data();
  $row["id"] = $doc->id();
  $members[] = $row;
}

json_response(["success"=>true,"members"=>$members]);