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

$firestore = new FirestoreService();

$docs = $firestore->collection("professionals")
  ->where("approved", "=", false)
  ->documents();

$results = [];
foreach ($docs as $d) {
  if (!$d->exists()) continue;
  $row = $d->data();
  if (($row["rejected"] ?? false) === true) continue; // hide rejected from pending
  $row["id"] = $d->id();
  $results[] = $row;
}

json_response(["success"=>true,"count"=>count($results),"professionals"=>$results]);
