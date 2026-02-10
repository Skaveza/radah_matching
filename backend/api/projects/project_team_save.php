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

$body = json_decode(file_get_contents("php://input"), true);

if (!isset($body["project_id"], $body["team"])) {
    json_response([
        "success" => false,
        "error" => "project_id and team are required"
    ], 400);
}

$firestore = new FirestoreService();

$firestore->collection("project_teams")->add([
    "project_id" => $body["project_id"],
    "team" => $body["team"],
    "locked" => false,
    "created_at" => date("c")
]);

json_response([
    "success" => true,
    "message" => "Team saved"
]);