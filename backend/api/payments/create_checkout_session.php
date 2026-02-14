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
$email = $authUser["email"] ?? null;

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

$projectId = $body["project_id"] ?? null;
$plan = $body["plan"] ?? "blueprint";
if (!$projectId) json_response(["success"=>false,"error"=>"project_id is required"], 422);

// Ensure plan key is one of allowed values
$allowedPlans = ["blueprint", "pro", "membership"];
if (!in_array($plan, $allowedPlans, true)) {
  json_response(["success"=>false,"error"=>"Invalid plan","allowed"=>$allowedPlans], 422);
}

$firestore = new FirestoreService();

// Project exists + ownership
$projectSnap = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projectSnap->exists()) json_response(["success"=>false,"error"=>"Project not found"], 404);

$project = $projectSnap->data();
if (($project["entrepreneur_id"] ?? "") !== $uid) {
  json_response(["success"=>false,"error"=>"Not your project"], 403);
}

// Stripe price mapping (these env vars must exist on Render)
$priceId = match($plan) {
  "blueprint" => $_ENV["STRIPE_PRICE_BLUEPRINT"] ?? null,
  "pro" => $_ENV["STRIPE_PRICE_PRO"] ?? null,
  "membership" => $_ENV["STRIPE_PRICE_MEMBERSHIP"] ?? null,
  default => null
};
if (!$priceId) json_response(["success"=>false,"error"=>"Missing Stripe price id for plan"], 500);

$stripeKey = $_ENV["STRIPE_SECRET_KEY"] ?? null;
if (!$stripeKey) json_response(["success"=>false,"error"=>"Missing STRIPE_SECRET_KEY"], 500);

Stripe::setApiKey($stripeKey);

$frontend = rtrim($_ENV["FRONTEND_URL"] ?? "http://localhost:5173", "/");
$isSubscription = ($plan === "membership");

$payload = [
  "mode" => $isSubscription ? "subscription" : "payment",
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
];

// optional but helpful
if ($email) {
  $payload["customer_email"] = $email;
}

try {
  $session = Session::create($payload);
} catch (\Throwable $e) {
  json_response(["success"=>false,"error"=>"Stripe session creation failed","details"=>$e->getMessage()], 500);
}

json_response([
  "success" => true,
  "url" => $session->url
]);
