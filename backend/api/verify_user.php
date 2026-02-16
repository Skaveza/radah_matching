<?php
require __DIR__ . '/../bootstrap.php';
require __DIR__ . '/middlewear/firebase_middlewear_v2.php';
require __DIR__ . '/../firestore_service.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(); // any logged-in user

$uid = $authUser["uid"];
$userDoc = $authUser["userDoc"] ?? [];

$role = $userDoc["role"] ?? null;

$firestore = new FirestoreService();
$userRef = $firestore->collection("users")->document($uid);

// base upsert (always)
$baseUpdate = [
  "email" => $userDoc["email"] ?? null,
  "name" => $userDoc["name"] ?? null,
  "role" => $role,
  "region" => $userDoc["region"] ?? null,
  "updated_at" => date("c"),
];

// entrepreneur-only billing defaults
$billingDefaults = [];
if ($role === "entrepreneur") {
  $billingDefaults = [
    // choose ONE naming style and keep it consistent everywhere:
    "payment_status" => $userDoc["payment_status"] ?? "inactive",
    "plan" => $userDoc["plan"] ?? null,

    // optional stripe fields if you use them
    "stripe_customer_id" => $userDoc["stripe_customer_id"] ?? null,
    "stripe_subscription_id" => $userDoc["stripe_subscription_id"] ?? null,
  ];
} else {
  // professionals do not pay; keep clean
  $billingDefaults = [
    "payment_status" => null,
    "plan" => null,
    "stripe_customer_id" => null,
    "stripe_subscription_id" => null,
  ];
}

$userRef->set(array_merge($baseUpdate, $billingDefaults), ["merge" => true]);

$response = [
  "success" => true,
  "uid" => $uid,
  "role" => $role,
  "professional_status" => $userDoc["professional_status"] ?? null,
];

// only return billing fields for entrepreneurs (clean API)
if ($role === "entrepreneur") {
  $response["payment_status"] = $billingDefaults["payment_status"];
  $response["plan"] = $billingDefaults["plan"];
}

json_response($response);
