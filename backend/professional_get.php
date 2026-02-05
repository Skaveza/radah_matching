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
    $id = $_GET["id"] ?? null;

    if (!$id || trim($id) === "") {
        json_response([
            "success" => false,
            "error" => "Missing required query param: id"
        ], 400);
    }

    $id = trim($id);

    $firestore = new FirestoreService();
    $docRef = $firestore->collection("professionals")->document($id);
    $snapshot = $docRef->snapshot();

    if (!$snapshot->exists()) {
        json_response([
            "success" => false,
            "error" => "Professional not found",
            "id" => $id
        ], 404);
    }

    $data = $snapshot->data();
    $data["id"] = $snapshot->id();

    json_response([
        "success" => true,
        "professional" => $data
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}
