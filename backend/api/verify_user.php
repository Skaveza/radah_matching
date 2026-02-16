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
$email = $userDoc["email"] ?? null;

$firestore = new FirestoreService();
$userRef = $firestore->collection("users")->document($uid);

// -------------------------------
// Determine role
// -------------------------------
$role = $userDoc["role"] ?? null;

// Check if user is already in Firestore admins
$adminRef = $firestore->collection("admins")->document($uid);
$adminSnapshot = $adminRef->snapshot();

if (!$adminSnapshot->exists()) {
    // Admin not yet registered in Firestore
    // Check if email exists in .env
    $envAdmins = getenv('ADMIN_EMAILS') ?: '';
    $envAdmins = array_map('trim', explode(',', $envAdmins));

    if ($email && in_array($email, $envAdmins)) {
        // Promote to admin in Firestore
        $role = "admin";
        $adminRef->set([
            'uid' => $uid,
            'email' => $email,
            'created_at' => date("c")
        ]);
    }
}

// -------------------------------
//  Prepare user document (merge)
// -------------------------------
$baseUpdate = [
    "email" => $email ?? null,
    "name" => $userDoc["name"] ?? null,
    "role" => $role,
    "region" => $userDoc["region"] ?? null,
    "updated_at" => date("c"),
];

// entrepreneur-only billing defaults
if ($role === "entrepreneur") {
    $billingDefaults = [
        "payment_status" => $userDoc["payment_status"] ?? "inactive",
        "plan" => $userDoc["plan"] ?? null,
        "stripe_customer_id" => $userDoc["stripe_customer_id"] ?? null,
        "stripe_subscription_id" => $userDoc["stripe_subscription_id"] ?? null,
    ];
} else {
    $billingDefaults = [
        "payment_status" => null,
        "plan" => null,
        "stripe_customer_id" => null,
        "stripe_subscription_id" => null,
    ];
}

$userRef->set(array_merge($baseUpdate, $billingDefaults), ["merge" => true]);

// -------------------------------
//  Prepare response
// -------------------------------
$response = [
    "success" => true,
    "uid" => $uid,
    "role" => $role,
    "professional_status" => $userDoc["professional_status"] ?? null,
];

if ($role === "entrepreneur") {
    $response["payment_status"] = $billingDefaults["payment_status"];
    $response["plan"] = $billingDefaults["plan"];
}

json_response($response);
