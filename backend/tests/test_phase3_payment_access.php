#!/usr/bin/env php
<?php

require __DIR__ . '/../bootstrap.php';
require __DIR__ . '/../firestore_service.php';

echo "=== Phase 3 Payment Access Test ===\n";

$firestore = new FirestoreService();

/**
 * -------------------------------------
 * 1. Setup test entrepreneur
 * -------------------------------------
 */
$entrepreneurId = "ent_test_phase3";

$firestore->collection("entrepreneurs")->document($entrepreneurId)->set([
    "payment_status" => "inactive",
    "plan" => "blueprint",
    "max_projects" => 1,
    "projects_created" => 0
]);

echo "Entrepreneur created with INACTIVE payment\n";

/**
 * -------------------------------------
 * 2. Test professional contact lock
 * -------------------------------------
 */

$proId = "prof_test_phase3";

$firestore->collection("professionals")->document($proId)->set([
    "full_name" => "Locked Pro",
    "email" => "locked@email.com",
    "phone" => "0700000000",
    "linkedin" => "linkedin.com/test",
    "primary_role" => "data_analyst",
    "status" => "approved"
]);

echo "Professional created\n";

echo "\n[1] Checking contact visibility (should be hidden)...\n";

$response = file_get_contents("http://localhost:80/api/professionals/professional_get.php?id=$proId&entrepreneur_id=$entrepreneurId");
$data = json_decode($response, true);

if (isset($data["professional"]["email"])) {
    echo " Contact info visible when payment inactive\n";
    exit;
}

echo " Contact info correctly hidden\n";

/**
 * -------------------------------------
 * 3. Activate payment
 * -------------------------------------
 */

// Activate payment for this entrepreneur in the entrepreneurs collection
$firestore->collection("entrepreneurs")->document($entrepreneurId)->update([
    ['path' => 'payment_status', 'value' => 'active']
]);

echo "\nPayment activated\n";

echo "\n[2] Checking contact visibility (should be visible)...\n";

// Small delay to ensure Firestore update is visible before we read it
sleep(1);

$response = file_get_contents("http://localhost:80/api/professionals/professional_get.php?id=$proId&entrepreneur_id=$entrepreneurId");
$data = json_decode($response, true);

if (!isset($data["professional"]["email"])) {
    echo " Contact info hidden even though payment active\n";
    exit;
}

echo " Contact info visible when payment active\n";

echo "\n Phase 3 payment test passed.\n";