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

$body = json_decode(file_get_contents("php://input"), true);

if (!isset($body["project_id"], $body["title"])) {
  json_response(["success"=>false,"error"=>"Missing required fields"], 400);
}

$firestore = new FirestoreService();

$doc = $firestore->collection("tasks")->add([
  "project_id" => $body["project_id"],
  "title" => $body["title"],
  "description" => $body["description"] ?? null,
  "assigned_to_name" => $body["assigned_to_name"] ?? null,
  "status" => $body["status"] ?? "todo",
  "priority" => $body["priority"] ?? "medium",
  "estimated_hours" => $body["estimated_hours"] ?? null,
  "due_date" => $body["due_date"] ?? null,
  "created_at" => date("c"),
  "updated_at" => date("c"),
]);

json_response(["success"=>true,"task_id"=>$doc->id()]);