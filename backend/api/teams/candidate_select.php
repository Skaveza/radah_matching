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

if (!isset($body["candidate_id"])) {
  json_response(["success"=>false,"error"=>"candidate_id required"], 400);
}

$candidateId = trim($body["candidate_id"]);
$firestore = new FirestoreService();

// candidate doc
$ref = $firestore->collection("candidates")->document($candidateId);
$snap = $ref->snapshot();

if (!$snap->exists()) {
  json_response(["success"=>false,"error"=>"Candidate not found"], 404);
}

$candidate = $snap->data();

// Update → shortlisted ONLY
$ref->set([
  "status" => "shortlisted",
  "updated_at" => date("c"),
], ["merge" => true]);

json_response([
  "success" => true,
  "status" => "shortlisted"
]);