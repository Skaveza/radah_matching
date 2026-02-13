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
$mw->verifyToken(["admin"]);

$uid = $_GET["uid"] ?? null;
if (!$uid) json_response(["success"=>false,"error"=>"Missing uid"], 400);

$firestore = new FirestoreService();

$proSnap = $firestore->collection("professionals")->document($uid)->snapshot();
if (!$proSnap->exists()) json_response(["success"=>false,"error"=>"Professional not found"], 404);

$now = date("c");

$firestore->collection("professionals")->document($uid)->set([
  "approved" => false,
  "rejected" => true,
  "rejected_at" => $now,
  "updated_at" => $now
], ["merge" => true]);

$firestore->collection("users")->document($uid)->set([
  "professional_status" => "rejected",
  "updated_at" => $now
], ["merge" => true]);

json_response(["success"=>true,"uid"=>$uid,"approved"=>false,"rejected"=>true]);
