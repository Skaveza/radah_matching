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
if (!$webhookSecret) json_response(["success"=>false,"error"=>"Missing STRIPE_WEBHOOK_SECRET"], 500);

$stripeSecretKey = $_ENV["STRIPE_SECRET_KEY"] ?? null;
if (!$stripeSecretKey) json_response(["success"=>false,"error"=>"Missing STRIPE_SECRET_KEY"], 500);

$payload = @file_get_contents("php://input");
$sigHeader = $_SERVER["HTTP_STRIPE_SIGNATURE"] ?? "";

try {
  Stripe::setApiKey($stripeSecretKey);
  $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
} catch (\Throwable $e) {
  json_response(["success"=>false,"error"=>"Webhook signature verification failed"], 400);
}

$firestore = new FirestoreService();
$now = date("c");

try {
  // -----------------------------
  //  Idempotency (CRITICAL)
  // -----------------------------
  $eventId = $event->id ?? null;
  if ($eventId) {
    $existing = $firestore->collection("stripe_events")->document($eventId)->snapshot();
    if ($existing->exists()) {
      json_response(["success"=>true,"message"=>"Event already processed","event_id"=>$eventId], 200);
    }
  }

  // Helper: mark processed
  $markProcessed = function() use ($firestore, $eventId, $event, $now) {
    if ($eventId) {
      $firestore->collection("stripe_events")->document($eventId)->set([
        "processed_at" => $now,
        "type" => $event->type ?? null,
      ], ["merge" => true]);
    }
  };

  // ---------------------------------------
  // 1) Checkout completed (subscription OR payment)
  // ---------------------------------------
  if ($event->type === "checkout.session.completed") {
    /** @var \Stripe\Checkout\Session $session */
    $session = $event->data->object;

    $mode = $session->mode ?? "payment";
    $meta = (array)($session->metadata ?? []);
    $plan = $meta["plan"] ?? null;
    $uid = $meta["entrepreneur_id"] ?? null;
    $projectId = $meta["project_id"] ?? null;

    //  SUBSCRIPTION checkout
    if ($mode === "subscription") {
      $subscriptionId = $session->subscription ?? null;

      if (!$subscriptionId || !$uid) {
        $markProcessed();
        json_response(["success"=>true,"message"=>"Subscription checkout missing uid/subscription"], 200);
      }

      // Fetch full subscription for accurate state
      $subscription = \Stripe\Subscription::retrieve($subscriptionId);

      $status = $subscription->status ?? "active";
      $currentPeriodEnd = isset($subscription->current_period_end)
        ? date("c", $subscription->current_period_end)
        : null;

      //  Architect membership: set plan + active + unlimited project limit
      $firestore->collection("users")->document($uid)->set([
        "membership_status" => ($status === "active") ? "active" : "inactive",
        "stripe_subscription_id" => $subscriptionId,
        "plan" => "membership",
        "payment_status" => $status,
        "subscription_current_period_end" => $currentPeriodEnd,
        "projects_limit" => -1,
        "updated_at" => $now,
      ], ["merge" => true]);

      $markProcessed();
      json_response(["success"=>true,"message"=>"Subscription activated"], 200);
    }

    // ✅ ONE-TIME payment checkout
    if ($mode === "payment") {
      $paymentStatus = $session->payment_status ?? null;
      if ($paymentStatus !== "paid") {
        $markProcessed();
        json_response(["success"=>true,"message"=>"Checkout completed but not paid yet","payment_status"=>$paymentStatus], 200);
      }

      if (!$projectId) {
        $markProcessed();
        json_response(["success"=>true,"message"=>"No project_id in metadata"], 200);
      }

      // customer email
      $customerEmail = null;
      if (isset($session->customer_details) && isset($session->customer_details->email)) {
        $customerEmail = $session->customer_details->email;
      } elseif (isset($session->customer_email)) {
        $customerEmail = $session->customer_email;
      }

      // project idempotency (avoid double unlock)
      $projectRef = $firestore->collection("projects")->document($projectId);
      $projectSnap = $projectRef->snapshot();
      if ($projectSnap->exists()) {
        $p = $projectSnap->data();
        if (($p["payment_status"] ?? null) === "paid") {
          $markProcessed();
          json_response(["success"=>true,"message"=>"Already paid (project idempotent)","project_id"=>$projectId], 200);
        }
      }

      // Unlock project
      $projectRef->update([
        ['path' => 'unlocked', 'value' => true],
        ['path' => 'payment_status', 'value' => 'paid'],
        ['path' => 'payment_plan', 'value' => $plan],
        ['path' => 'stripe_checkout_session_id', 'value' => $session->id ?? null],
        ['path' => 'stripe_payment_intent_id', 'value' => $session->payment_intent ?? null],
        ['path' => 'paid_at', 'value' => $now],
        ['path' => 'amount_total', 'value' => $session->amount_total ?? null],
        ['path' => 'currency', 'value' => $session->currency ?? null],
        ['path' => 'customer_email', 'value' => $customerEmail],
        ['path' => 'updated_at', 'value' => $now],
      ]);

      // Unlock team doc
      $firestore->collection("project_teams")->document($projectId)->set([
        'locked' => false,
        'status' => 'unlocked',
        'updated_at' => $now,
      ], ['merge' => true]);

      // OPTIONAL: store scenario entitlement on project
      // blueprint => 1 scenario, pro => 2 scenarios
      $scenarios = ($plan === "pro") ? 2 : 1;
      $projectRef->set([
        "team_scenarios_unlocked" => $scenarios,
      ], ["merge" => true]);

      $markProcessed();
      json_response(["success"=>true,"message"=>"One-time payment recorded","project_id"=>$projectId], 200);
    }

    $markProcessed();
    json_response(["success"=>true,"message"=>"checkout.session.completed processed (unknown mode)"], 200);
  }

  // ---------------------------------------
  // 2) Recurring invoice paid (keep active)
  // ---------------------------------------
  if ($event->type === "invoice.paid") {
    $invoice = $event->data->object;
    $subscriptionId = $invoice->subscription ?? null;

    if ($subscriptionId) {
      $subscription = \Stripe\Subscription::retrieve($subscriptionId);
      $status = $subscription->status ?? "active";
      $currentPeriodEnd = isset($subscription->current_period_end)
        ? date("c", $subscription->current_period_end)
        : null;

      $users = $firestore->collection("users")
        ->where("stripe_subscription_id", "=", $subscriptionId)
        ->documents();

      foreach ($users as $user) {
        $user->reference()->set([
          "membership_status" => ($status === "active") ? "active" : "inactive",
          "payment_status" => $status,
          "subscription_current_period_end" => $currentPeriodEnd,
          "projects_limit" => ($status === "active") ? -1 : 0,
          "updated_at" => $now,
        ], ["merge" => true]);
      }
    }

    $markProcessed();
    json_response(["success"=>true,"message"=>"invoice.paid handled"], 200);
  }

  // ---------------------------------------
  // 3) Payment failure (PAST_DUE)
  // ---------------------------------------
  if ($event->type === "invoice.payment_failed") {
    $invoice = $event->data->object;
    $subscriptionId = $invoice->subscription ?? null;

    if ($subscriptionId) {
      $users = $firestore->collection("users")
        ->where("stripe_subscription_id", "=", $subscriptionId)
        ->documents();

      foreach ($users as $user) {
        $user->reference()->set([
          "membership_status" => "past_due",
          "payment_status" => "past_due",
          "projects_limit" => 0,
          "updated_at" => $now,
        ], ["merge" => true]);
      }
    }

    $markProcessed();
    json_response(["success"=>true,"message"=>"invoice.payment_failed handled"], 200);
  }

  // ---------------------------------------
  // 4) Subscription updated (cancel at period end / status change)
  // ---------------------------------------
  if ($event->type === "customer.subscription.updated") {
    $subscription = $event->data->object;

    $subscriptionId = $subscription->id ?? null;
    $status = $subscription->status ?? "inactive";
    $currentPeriodEnd = isset($subscription->current_period_end)
      ? date("c", $subscription->current_period_end)
      : null;

    if ($subscriptionId) {
      $users = $firestore->collection("users")
        ->where("stripe_subscription_id", "=", $subscriptionId)
        ->documents();

      foreach ($users as $user) {
        $user->reference()->set([
          "membership_status" => ($status === "active") ? "active" : "inactive",
          "payment_status" => $status,
          "subscription_current_period_end" => $currentPeriodEnd,
          "projects_limit" => ($status === "active") ? -1 : 0,
          "updated_at" => $now,
        ], ["merge" => true]);
      }
    }

    $markProcessed();
    json_response(["success"=>true,"message"=>"customer.subscription.updated handled"], 200);
  }

  // ---------------------------------------
  // 5) Subscription deleted (hard cancel)
  // ---------------------------------------
  if ($event->type === "customer.subscription.deleted") {
    $sub = $event->data->object;
    $subscriptionId = $sub->id ?? null;

    if ($subscriptionId) {
      $users = $firestore->collection("users")
        ->where("stripe_subscription_id", "=", $subscriptionId)
        ->documents();

      foreach ($users as $user) {
        $user->reference()->set([
          "membership_status" => "inactive",
          "payment_status" => "canceled",
          "projects_limit" => 0,
          "updated_at" => $now,
        ], ["merge" => true]);
      }
    }

    $markProcessed();
    json_response(["success"=>true,"message"=>"customer.subscription.deleted handled"], 200);
  }

  // Keep your old handlers if you want (they can just acknowledge)
  if ($event->type === "charge.refunded") {
    $markProcessed();
    json_response(["success"=>true,"message"=>"charge.refunded received"], 200);
  }

  if ($event->type === "payment_intent.payment_failed") {
    $markProcessed();
    json_response(["success"=>true,"message"=>"payment_intent.payment_failed received"], 200);
  }

  $markProcessed();
  json_response(["success"=>true,"message"=>"Event ignored","type"=>$event->type], 200);

} catch (\Throwable $e) {
  // 500 makes Stripe retry (good if Firestore temporarily down)
  json_response(["success"=>false,"error"=>"Webhook handler error","details"=>$e->getMessage()], 500);
}
