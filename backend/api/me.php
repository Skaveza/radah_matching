<?php
require __DIR__ . '/../bootstrap.php';
require __DIR__ . '/../firestore_service.php';
require __DIR__ . '/middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(); // token only; userDoc may be empty

$userDoc = $authUser["userDoc"] ?? [];
$role = $authUser["role"] ?? ($userDoc["role"] ?? null);

$paymentStatus = $userDoc["payment_status"] ?? "inactive";
$plan = $userDoc["plan"] ?? null;

if ($role === "professional") {
  $paymentStatus = "not_required";
  if ($plan === null) $plan = "professional";
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
], JSON_PRETTY_PRINT);
