<?php

require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\Webhook;

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$webhookSecret = $_ENV["STRIPE_WEBHOOK_SECRET"] ?? null;
if (!$webhookSecret) json_response(["success" => false, "error" => "Missing STRIPE_WEBHOOK_SECRET"], 500);

$stripeSecretKey = $_ENV["STRIPE_SECRET_KEY"] ?? null;
if (!$stripeSecretKey) json_response(["success" => false, "error" => "Missing STRIPE_SECRET_KEY"], 500);

$payload = @file_get_contents("php://input");
$sigHeader = $_SERVER["HTTP_STRIPE_SIGNATURE"] ?? "";

try {
  Stripe::setApiKey($stripeSecretKey);
  $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
} catch (\Throwable $e) {
  // Stripe expects 4xx for bad signatures/payloads
  json_response(["success" => false, "error" => "Webhook signature verification failed"], 400);
}

$firestore = new FirestoreService();

try {
  // ✅ Payment succeeded (Checkout)
  if ($event->type === "checkout.session.completed") {
    /** @var \Stripe\Checkout\Session $session */
    $session = $event->data->object;

    // Safer: only process if Stripe says payment is paid
    $paymentStatus = $session->payment_status ?? null;
    if ($paymentStatus !== "paid") {
      json_response([
        "success" => true,
        "message" => "Checkout completed but not paid yet",
        "payment_status" => $paymentStatus
      ], 200);
    }

    $projectId = $session->metadata->project_id ?? null;
    if (!$projectId) json_response(["success" => true, "message" => "No project_id in metadata"], 200);

    $now = date("c");

    $plan = $session->metadata->plan ?? null;

    // customer email
    $customerEmail = null;
    if (isset($session->customer_details) && isset($session->customer_details->email)) {
      $customerEmail = $session->customer_details->email;
    } elseif (isset($session->customer_email)) {
      $customerEmail = $session->customer_email;
    }

    //idempotency guard
    $projectSnap = $firestore->collection("projects")->document($projectId)->snapshot();
    $alreadyPaid = false;
    if ($projectSnap->exists()) {
      $p = $projectSnap->data();
      $alreadyPaid = (($p["payment_status"] ?? null) === "paid");
      // Optional: if already paid and same session id, you can early exit
      // if (($p["stripe_checkout_session_id"] ?? null) === ($session->id ?? null)) { ... }
    }

    // Update projects/{projectId}
    $firestore->collection("projects")->document($projectId)->update([
      ['path' => 'unlocked', 'value' => true],
      ['path' => 'payment_status', 'value' => 'paid'],

      // audit/proof fields
      ['path' => 'payment_plan', 'value' => $plan],
      ['path' => 'stripe_checkout_session_id', 'value' => $session->id ?? null],
      ['path' => 'stripe_payment_intent_id', 'value' => $session->payment_intent ?? null],
      ['path' => 'paid_at', 'value' => $now],
      ['path' => 'amount_total', 'value' => $session->amount_total ?? null],
      ['path' => 'currency', 'value' => $session->currency ?? null],
      ['path' => 'customer_email', 'value' => $customerEmail],
      ['path' => 'updated_at', 'value' => $now],
    ]);

    // Unlock project_teams/{projectId}
    $firestore->collection("project_teams")->document($projectId)->set([
      'locked' => false,
      'status' => 'unlocked',
      'updated_at' => $now,
    ], ['merge' => true]);

    json_response([
      "success" => true,
      "message" => $alreadyPaid ? "Already paid (idempotent)" : "Payment recorded",
      "project_id" => $projectId
    ], 200);
  }

  // Refund handling (keeps data consistent)
  if ($event->type === "charge.refunded") {
    $charge = $event->data->object;
    json_response(["success" => true, "message" => "Refund event received"], 200);
  }

  // Payment failed
  if ($event->type === "payment_intent.payment_failed") {
    $pi = $event->data->object;
    json_response(["success" => true, "message" => "Payment failed event received"], 200);
  }


  json_response(["success" => true, "message" => "Event ignored", "type" => $event->type], 200);

} catch (\Throwable $e) {
  // If Firestore is temporarily down, returning 500 makes Stripe retry.
  json_response(["success" => false, "error" => "Webhook handler error", "details" => $e->getMessage()], 500);
}
