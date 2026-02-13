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
$mw->verifyToken(["admin"]); // make it admin-only if you want

try {
  $firestore = new FirestoreService();
  $collection = $firestore->collection("professionals");

  $query = $collection->where("status", "==", "approved");
  $documents = $query->documents();

  $results = [];
  foreach ($documents as $doc) {
    if (!$doc->exists()) continue;
    $data = $doc->data();
    $data["id"] = $doc->id();
    $results[] = $data;
  }

  json_response(["success"=>true,"count"=>count($results),"professionals"=>$results]);

} catch (Exception $e) {
  json_response(["success"=>false,"error"=>"Server error","details"=>$e->getMessage()], 500);
}
