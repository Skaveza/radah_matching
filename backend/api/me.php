<?php
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/../firestore_service.php';
require_once __DIR__ . '/middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(); // token only

$firestore = new FirestoreService();

$userDoc = $authUser["userDoc"] ?? [];
$role = $authUser["role"] ?? ($userDoc["role"] ?? null);

$paymentStatus = $userDoc["payment_status"] ?? "inactive";
$plan = $userDoc["plan"] ?? null;

// ----------
// ✅ Defensive membership expiry check
// ----------
$membershipStatus = $userDoc["membership_status"] ?? null;
$periodEnd = $userDoc["subscription_current_period_end"] ?? null;

if ($plan === "membership" && $membershipStatus === "active" && is_string($periodEnd)) {
  $endTs = strtotime($periodEnd);
  if ($endTs !== false && $endTs < time()) {
    // expire locally if Stripe missed webhook / delays
    $membershipStatus = "inactive";
    $paymentStatus = "inactive";

    try {
      $firestore->collection("users")->document($authUser["uid"])->set([
        "membership_status" => "inactive",
        "payment_status" => "inactive",
        "updated_at" => date("c"),
      ], ["merge" => true]);
    } catch (\Throwable $e) {
      // ignore, fails closed anyway
    }
  }
}

if ($role === "professional") {
  $paymentStatus = "not_required";
  if ($plan === null) $plan = "professional";
}

if ($role === "admin") {
  $paymentStatus = "not_required";
  if ($plan === null) $plan = "admin";
}

echo json_encode([
  "success" => true,
  "uid" => $authUser["uid"],
  "role" => $role,
  "name" => $userDoc["name"] ?? ($authUser["name"] ?? null),
  "email" => $userDoc["email"] ?? ($authUser["email"] ?? null),
  "professional_status" => $userDoc["professional_status"] ?? null,

  "payment_status" => $paymentStatus,
  "plan" => $plan,

  // optional: expose membership info to frontend
  "membership_status" => $membershipStatus,
  "subscription_current_period_end" => $userDoc["subscription_current_period_end"] ?? null,
], JSON_PRETTY_PRINT);
