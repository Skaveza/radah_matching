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
$authUser = $mw->verifyToken(["professional"]); // professional-only
$uid = $authUser["uid"];

try {
  $firestore = new FirestoreService();
  $snap = $firestore->collection("professionals")->document($uid)->snapshot();

  if (!$snap->exists()) {
    json_response([
      "success" => true,
      "exists" => false,
      "professional" => null
    ]);
  }

  $data = $snap->data();
  $data["id"] = $uid;

  json_response([
    "success" => true,
    "exists" => true,
    "professional" => $data
  ]);

} catch (Exception $e) {
  json_response(["success"=>false,"error"=>"Server error","details"=>$e->getMessage()], 500);
}
