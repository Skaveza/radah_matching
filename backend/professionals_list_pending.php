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

try {
    $firestore = new FirestoreService();
    $collection = $firestore->collection("professionals");

    $query = $collection->where("status", "==", "pending_review");
    $documents = $query->documents();

    $results = [];
    foreach ($documents as $doc) {
        if (!$doc->exists()) continue;
        $row = $doc->data();
        $row["id"] = $doc->id();
        $results[] = $row;
    }

    json_response([
        "success" => true,
        "count" => count($results),
        "professionals" => $results
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}