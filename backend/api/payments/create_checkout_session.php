<?php
require __DIR__ . '/../bootstrap.php';
require __DIR__ . '/../firestore_service.php';
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../api/middlewear/firebase_middlewear_v2.php';

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
if (!is_array($body)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

$projectId = $body["project_id"] ?? null;
$plan = $body["plan"] ?? "starter";
if (!$projectId) json_response(["success"=>false,"error"=>"project_id is required"], 422);

$firestore = new FirestoreService();
$projectSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projectSnap->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

$project = $projectSnap->data();
if (($project["entrepreneur_id"] ?? "") !== $uid) {
  json_response(["success"=>false,"error"=>"Not your project"], 403);
}

$priceId = match($plan) {
  "blueprint" => $_ENV["STRIPE_PRICE_BLUEPRINT"] ?? null,
  "pro" => $_ENV["STRIPE_PRICE_PRO"] ?? null,
  "membership" => $_ENV["STRIPE_PRICE_MEMBERSHIP"] ?? null,
  default => null
};
if (!$priceId) json_response(["success"=>false,"error"=>"Invalid plan"], 422);

Stripe::setApiKey($_ENV["STRIPE_SECRET_KEY"] ?? "");

$frontend = rtrim($_ENV["FRONTEND_URL"] ?? "http://localhost:5173", "/");

$session = Session::create([
  "mode" => "payment",
  "line_items" => [[
    "price" => $priceId,
    "quantity" => 1
  ]],
  "success_url" => $frontend . "/payment-success?session_id={CHECKOUT_SESSION_ID}&projectId=" . urlencode($projectId),
  "cancel_url" => $frontend . "/dashboard?projectId=" . urlencode($projectId) . "&canceled=1",
  "metadata" => [
    "project_id" => $projectId,
    "entrepreneur_id" => $uid,
    "plan" => $plan
  ]
]);

json_response([
  "success" => true,
  "url" => $session->url
]);
