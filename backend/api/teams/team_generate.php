<?php

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';
require __DIR__ . '/matching_engine.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

$body = json_decode(file_get_contents("php://input"), true);

if (!isset($body["project_id"])) {
    json_response([
        "success" => false,
        "error" => "project_id is required"
    ], 400);
}

$projectId = $body["project_id"];
$firestore = new FirestoreService();

/* -----------------------------
 * Fetch project
 * ----------------------------- */
$projectDoc = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projectDoc->exists()) {
    json_response([
        "success" => false,
        "error" => "Project not found"
    ], 404);
}

$project = $projectDoc->data();

/* -----------------------------
 * Fetch recommendation snapshot
 * ----------------------------- */
$recDocs = $firestore
    ->collection("project_recommendations")
    ->where("project_id", "=", $projectId)
    ->limit(1)
    ->documents();

$recommendations = null;
foreach ($recDocs as $doc) {
    $recommendations = $doc->data()["recommendations"];
    break;
}

if (!$recommendations) {
    json_response([
        "success" => false,
        "error" => "No recommendations found"
    ], 400);
}

/* -----------------------------
 * Generate team
 * ----------------------------- */
$team = MatchingEngine::generateTeam(
    $recommendations["suggested_roles"],
    $project
);

json_response([
    "success" => true,
    "team" => $team
]);