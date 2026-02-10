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

if (!isset($_GET['entrepreneur_id'])) {
    json_response([
        "success" => false,
        "error" => "entrepreneur_id is required"
    ], 400);
}

$entrepreneurId = $_GET['entrepreneur_id'];
$firestore = new FirestoreService();

/* -----------------------------
 * Fetch projects
 * ----------------------------- */
$projectsQuery = $firestore->collection("projects")
    ->where("entrepreneur_id", "=", $entrepreneurId)
    ->documents();

$projects = [];

foreach ($projectsQuery as $projectDoc) {
    $project = $projectDoc->data();
    $projectId = $projectDoc->id();

    /* Recommendation snapshot */
    $recommendationDocs = $firestore
        ->collection("project_recommendations")
        ->where("project_id", "=", $projectId)
        ->limit(1)
        ->documents();

    $recommendations = null;
    foreach ($recommendationDocs as $recDoc) {
        $recommendations = $recDoc->data()["recommendations"];
        break;
    }

    /* Team (if generated) */
    $teamDocs = $firestore
        ->collection("project_teams")
        ->where("project_id", "=", $projectId)
        ->limit(1)
        ->documents();

    $team = null;
    foreach ($teamDocs as $teamDoc) {
        $team = $teamDoc->data();
        break;
    }

    $projects[] = [
        "project_id" => $projectId,
        "project" => $project,
        "recommendations" => $recommendations,
        "team" => $team
    ];
}

json_response([
    "success" => true,
    "projects" => $projects
]);