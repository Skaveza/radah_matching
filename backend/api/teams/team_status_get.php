<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

if (!isset($_GET["project_id"])) {
  json_response(["success"=>false,"error"=>"project_id required"], 400);
}

$projectId = $_GET["project_id"];

$firestore = new FirestoreService();

// fetch all team members
$docs = $firestore->collection("project_team_members")
  ->where("project_id", "=", $projectId)
  ->documents();

$roles_total = 0;
$roles_filled = 0;

$members = [];

foreach ($docs as $doc) {
  $data = $doc->data();
  $members[] = $data;

  $roles_total++;

  if (($data["status"] ?? "") === "accepted") {
    $roles_filled++;
  }
}

json_response([
  "success" => true,
  "project_id" => $projectId,
  "roles_total" => $roles_total,
  "roles_filled" => $roles_filled,
  "team_complete" => $roles_total > 0 && $roles_total === $roles_filled,
  "members" => $members
]);