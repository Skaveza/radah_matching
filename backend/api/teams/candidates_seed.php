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

if (!isset($body["project_id"]) || !isset($body["team"])) {
  json_response(["success"=>false,"error"=>"project_id and team required"], 400);
}

$projectId = $body["project_id"];
$team = $body["team"];

$firestore = new FirestoreService();

foreach ($team as $member) {
  $pro = $member["professional"] ?? null;
  if (!$pro) continue;

  $firestore->collection("candidates")->add([
    "project_id" => $projectId,
    "role" => $pro["primary_role"] ?? "unknown",
    "professional_id" => $pro["id"],
    "score" => $member["score"] ?? 0,
    "status" => "pending",
    "source" => "ai",
    "created_at" => date("c"),
    "updated_at" => date("c"),
  ]);
}

json_response(["success"=>true,"message"=>"Candidates seeded"]);