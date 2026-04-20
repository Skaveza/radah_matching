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
$user = $mw->verifyToken(["professional"]);
$uid = $user["uid"];

$body = json_decode(file_get_contents("php://input"), true);

if (!isset($body["team_member_id"]) || !isset($body["action"])) {
  json_response(["success"=>false,"error"=>"team_member_id and action required"], 400);
}

$teamMemberId = trim($body["team_member_id"]);
$action = trim($body["action"]); // accept | reject

$firestore = new FirestoreService();

$ref = $firestore->collection("project_team_members")->document($teamMemberId);
$snap = $ref->snapshot();

if (!$snap->exists()) {
  json_response(["success"=>false,"error"=>"Invite not found"], 404);
}

$data = $snap->data();

if (($data["professional_id"] ?? "") !== $uid) {
  json_response(["success"=>false,"error"=>"Forbidden"], 403);
}

$newStatus = $action === "accept" ? "accepted" : "rejected";

// Update invite
$ref->set([
  "status" => $newStatus,
  "updated_at" => date("c"),
], ["merge" => true]);

// If accepted → mark role as filled logically
if ($action === "accept") {
  $ref->set([
    "contract_status" => "awaiting_external_contact",
    "joined_at" => date("c"),
  ], ["merge" => true]);
}

// Optional: create engagement record
if ($action === "accept") {
  $firestore->collection("engagements")->add([
    "project_id" => $data["project_id"],
    "professional_id" => $uid,
    "role" => $data["role"],
    "status" => "active",
    "payment_mode" => "external",
    "created_at" => date("c"),
  ]);
}

json_response([
  "success" => true,
  "status" => $newStatus
]);