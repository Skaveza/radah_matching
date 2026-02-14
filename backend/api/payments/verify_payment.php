<?php
require __DIR__ . '/../../bootstrap.php';
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

$stripeKey = $_ENV["STRIPE_SECRET_KEY"] ?? getenv("STRIPE_SECRET_KEY");
if (!$stripeKey) json_response(["success"=>false,"message"=>"Missing STRIPE_SECRET_KEY"], 500);

Stripe::setApiKey($stripeKey);

try {
  $session = Session::retrieve($sessionId);
} catch (\Throwable $e) {
  json_response(["success"=>false,"message"=>"Invalid Stripe session"], 400);
}

$paymentStatus = $session->payment_status ?? null;
$mode = $session->mode ?? null;

$meta = (array)($session->metadata ?? []);
$projectId = $meta["project_id"] ?? null;
$entrepreneurId = $meta["entrepreneur_id"] ?? null;
$plan = $meta["plan"] ?? null;

if (!$projectId || !$entrepreneurId) {
  json_response(["success"=>false,"message"=>"Missing metadata"], 400);
}

if ($entrepreneurId !== $uid) {
  json_response(["success"=>false,"message"=>"Forbidden"], 403);
}

json_response([
  "success" => true,
  "session_id" => $session->id ?? $sessionId,
  "mode" => $mode,
  "payment_status" => $paymentStatus,
  "plan" => $plan,
  "project_id" => $projectId,
  "amount_total" => $session->amount_total ?? null,
  "currency" => $session->currency ?? null,
  "customer_email" => $session->customer_details->email ?? ($session->customer_email ?? null),
]);
