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
$authUser = $mw->verifyToken(["professional"]);
$uid = $authUser["uid"];

try {
  $firestore = new FirestoreService();

  $docs = $firestore->collection("project_teams")->documents();

  $matches = [];
  foreach ($docs as $d) {
    if (!$d->exists()) continue;
    $row = $d->data();

    $team = $row["team"] ?? [];
    if (!is_array($team)) continue;

    $inTeam = false;
    foreach ($team as $member) {
      // your team_generate adds $row["id"] = $p->id(), so "id" should exist
      if (is_array($member) && isset($member["id"]) && (string)$member["id"] === (string)$uid) {
        $inTeam = true;
        break;
      }
    }

    if ($inTeam) {
      $row["id"] = $d->id(); // projectId
      $matches[] = $row;
    }
  }

  // newest first
  usort($matches, function($a, $b) {
    $ta = $a["updated_at"] ?? "";
    $tb = $b["updated_at"] ?? "";
    return strcmp($tb, $ta);
  });

  json_response([
    "success" => true,
    "count" => count($matches),
    "matches" => $matches
  ]);

} catch (Exception $e) {
  json_response(["success"=>false,"error"=>"Server error","details"=>$e->getMessage()], 500);
}
