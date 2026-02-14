<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../vendor/autoload.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';

use Stripe\Stripe;
use Stripe\Checkout\Session;

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$uid = $authUser["uid"];

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success"=>false,"message"=>"Invalid JSON"], 400);

$sessionId = $body["session_id"] ?? null;
if (!$sessionId) json_response(["success"=>false,"message"=>"session_id is required"], 422);

Stripe::setApiKey($_ENV["STRIPE_SECRET_KEY"] ?? "");

try {
  $session = Session::retrieve($sessionId);
} catch (\Throwable $e) {
  json_response(["success"=>false,"message"=>"Invalid Stripe session"], 400);
}

// Must be paid
if (($session->payment_status ?? "") !== "paid") {
  json_response(["success"=>false,"message"=>"Payment not completed"], 400);
}

$meta = (array)($session->metadata ?? []);
$projectId = $meta["project_id"] ?? null;
$entrepreneurId = $meta["entrepreneur_id"] ?? null;

if (!$projectId || !$entrepreneurId) {
  json_response(["success"=>false,"message"=>"Missing metadata"], 400);
}

if ($entrepreneurId !== $uid) {
  json_response(["success"=>false,"message"=>"Forbidden"], 403);
}

$firestore = new FirestoreService();

// Mark project unlocked
$firestore->collection("projects")->document($projectId)->set([
  "unlocked" => true,
  "updated_at" => date("c")
], ["merge" => true]);

// Mark team unlocked too (optional but recommended)
$firestore->collection("project_teams")->document($projectId)->set([
  "locked" => false,
  "updated_at" => date("c")
], ["merge" => true]);

// Build unlocked professionals list from stored team
$teamSnap = $firestore->collection("project_teams")->document($projectId)->snapshot();
$teamDoc = $teamSnap->exists() ? $teamSnap->data() : [];
$team = $teamDoc["team"] ?? [];

$professionals = [];
foreach ($team as $member) {
  $p = $member["professional"] ?? null;
  if (!is_array($p)) continue;

  $professionals[] = [
    "roleTitle" => $p["primary_role"] ?? ($p["title"] ?? "Recommended Specialist"),
    "name" => $p["name"] ?? ($p["full_name"] ?? "Professional"),
    "email" => $p["email"] ?? "",
    "linkedin" => $p["linkedin"] ?? "",
    "phone" => $p["phone"] ?? null,
    "portfolio" => $p["portfolio"] ?? null,
  ];
}

json_response([
  "success" => true,
  "teamName" => "Your Team",
  "professionals" => $professionals
]);
