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

$id = $id ?? null;
if (!$id) json_response(["success"=>false,"error"=>"task id required"], 400);

$body = json_decode(file_get_contents("php://input"), true);
if (!$body) json_response(["success"=>false,"error"=>"invalid body"], 400);

$firestore = new FirestoreService();

$body["updated_at"] = date("c");

$firestore->collection("tasks")->document($id)->set($body, ["merge"=>true]);

json_response(["success"=>true]);