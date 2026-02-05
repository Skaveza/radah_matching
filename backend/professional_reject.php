<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

$id = $_GET["id"] ?? null;
if (!$id) {
    json_response([
        "success" => false,
        "error" => "Missing professional id"
    ], 400);
}

try {
    $firestore = new FirestoreService();

    $proRef = $firestore->collection("professionals")->document($id);
    $snapshot = $proRef->snapshot();

    if (!$snapshot->exists()) {
        json_response([
            "success" => false,
            "error" => "Professional not found"
        ], 404);
    }

    $proRef->set([
        "status" => "rejected",
        "reviewed_at" => date("c")
    ], ["merge" => true]);

    json_response([
        "success" => true,
        "message" => "Professional rejected",
        "id" => $id,
        "status" => "rejected"
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}

// Resolve admin notifications
$notifications = $firestore->collection("admin_notifications")
    ->where("professional_id", "==", $id)
    ->where("status", "==", "unread")
    ->documents();

foreach ($notifications as $note) {
    $note->reference()->set([
        "status" => "resolved",
        "resolved_at" => date("c")
    ], ["merge" => true]);
}