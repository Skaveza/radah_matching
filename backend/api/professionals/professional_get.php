<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
header("Content-Type: application/json");

function json_response($data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

try {
    $id = $_GET["id"] ?? null;
    $entrepreneurId = $_GET["entrepreneur_id"] ?? null;

    if (!$id || trim($id) === "" || !$entrepreneurId) {
        json_response([
            "success" => false,
            "error" => "Missing required query params: id and entrepreneur_id"
        ], 400);
    }

    $id = trim($id);
    $entrepreneurId = trim($entrepreneurId);

    $firestore = new FirestoreService();

    // Check professional
    $docRef = $firestore->collection("professionals")->document($id);
    $snapshot = $docRef->snapshot();

    if (!$snapshot->exists()) {
        json_response([
            "success" => false,
            "error" => "Professional not found",
            "id" => $id
        ], 404);
    }

    $professional = $snapshot->data();
    $professional["id"] = $snapshot->id();

    // Debug: log professional data as stored before any filtering
    error_log("Professional Data (raw): " . json_encode($professional));

    // Check entrepreneur payment status in the entrepreneurs collection
    $userDoc = $firestore->collection("entrepreneurs")->document($entrepreneurId)->snapshot();

    // Debug: log which entrepreneur ID and data we are checking
    error_log("Entrepreneur ID: " . $entrepreneurId);
    if ($userDoc->exists()) {
        error_log("Payment Data: " . json_encode($userDoc->data()));
    } else {
        error_log("Payment Data: document not found");
    }

    $paymentActive = $userDoc->exists() && ($userDoc->data()["payment_status"] ?? "") === "active";

    // Debug: log whether API thinks payment is active
    error_log("Payment Active Flag: " . ($paymentActive ? "true" : "false"));

    // Hide sensitive info if payment inactive
    if (!$paymentActive) {
        error_log("Hiding contact info for professional " . $professional["id"]);
        unset($professional["email"], $professional["phone"], $professional["linkedin"]);
    } else {
        error_log("Keeping contact info for professional " . $professional["id"]);
    }

    json_response([
        "success" => true,
        "professional" => $professional,
        "payment_active" => $paymentActive
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}
