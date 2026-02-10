<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../matching_engine.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    json_response(["success" => false, "error" => "Invalid method"], 405);
}

$teamId = $_GET["team_id"] ?? null;
if (!$teamId) {
    json_response(["success" => false, "error" => "Missing team_id"], 400);
}

$payload = json_decode(file_get_contents("php://input"), true);
if (!is_array($payload)) {
    json_response(["success" => false, "error" => "Invalid JSON body"], 400);
}

$removeIds = $payload["remove_professionals"] ?? [];
$addRoles  = $payload["add_roles"] ?? [];

if (count($removeIds) > 3 || count($addRoles) > 3) {
    json_response([
        "success" => false,
        "error" => "You can add/remove a maximum of 3 members"
    ], 422);
}

$firestore = new FirestoreService();

/**
 * Load team
 */
$teamDoc = $firestore->collection("project_teams")->document($teamId)->snapshot();
if (!$teamDoc->exists()) {
    json_response(["success" => false, "error" => "Team not found"], 404);
}

$team = $teamDoc->data();
$entrepreneurId = $team['entrepreneur_id'] ?? null;

if (!$entrepreneurId) {
    json_response(["success" => false, "error" => "Team has no associated entrepreneur"], 400);
}

// Check entrepreneur payment status
$userDoc = $firestore->collection('entrepreneurs')->document($entrepreneurId)->snapshot();
if (!$userDoc->exists() || ($userDoc->data()['payment_status'] ?? '') !== 'active') {
    json_response([
        'success' => false,
        'error' => 'Payment required to modify team'
    ], 403);
}

if (($team["status"] ?? "draft") !== "draft") {
    json_response([
        "success" => false,
        "error" => "Team can no longer be modified"
    ], 403);
}

/**
 * Remove members
 */
$membersRef = $firestore->collection("project_team_members");
foreach ($removeIds as $proId) {
    $query = $membersRef
        ->where("team_id", "=", $teamId)
        ->where("professional_id", "=", $proId)
        ->documents();
    foreach ($query as $doc) {
        $doc->reference()->delete();
    }
}

/**
 * Add new members via matching
 */
$added = [];
if (!empty($addRoles)) {
    $projectId = $team["project_id"];
    $projectDoc = $firestore->collection("projects")->document($projectId)->snapshot();

    if (!$projectDoc->exists()) {
        json_response(["success" => false, "error" => "Project not found"], 404);
    }

    $project = $projectDoc->data();

    $professionals = [];
    $prosSnap = $firestore->collection("professionals")
        ->where("status", "=", "approved")
        ->documents();
    foreach ($prosSnap as $p) {
        $professionals[] = array_merge($p->data(), ["id" => $p->id()]);
    }

    foreach ($addRoles as $role) {
        $filtered = array_filter($professionals, fn($p) =>
            ($p["primary_role"] ?? null) === $role
        );
        if (empty($filtered)) continue;

        $result = MatchingEngine::generateTeam($project, $filtered, 1);
        if (empty($result["team"])) continue;

        $candidate = $result["team"][0]["professional"];
        $membersRef->add([
            "team_id" => $teamId,
            "professional_id" => $candidate["id"],
            "role" => $role,
            "status" => "invited",
            "created_at" => date("c")
        ]);
        $added[] = $candidate["id"];
    }
}

json_response([
    "success" => true,
    "removed" => $removeIds,
    "added" => $added,
    "message" => "Team updated"
]);
