<?php

require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../enums/team_status_enums.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

// Support both JSON body and x-www-form-urlencoded
$bodyJson = json_decode(file_get_contents("php://input"), true);
$data = is_array($bodyJson) ? array_merge($_POST, $bodyJson) : $_POST;

if (!isset($data['team_member_id']) || $data['team_member_id'] === '') {
    json_response([
        'success' => false,
        'error'   => 'team_member_id is required',
    ], 400);
}

$teamMemberId = $data['team_member_id'];

$statuses = require __DIR__ . '/../../enums/team_status_enums.php';
$statusAccepted = $statuses['ACCEPTED'] ?? 'accepted';

$firestore = new FirestoreService();
$doc = $firestore->collection('project_team_members')->document($teamMemberId)->snapshot();

if (!$doc->exists()) {
    json_response([
        'success' => false,
        'error'   => 'Team member not found',
    ], 404);
}

$doc->reference()->update([
    ['path' => 'status', 'value' => $statusAccepted],
    ['path' => 'updated_at', 'value' => date('c')],
]);

json_response([
    'success'        => true,
    'status'         => $statusAccepted,
    'team_member_id' => $teamMemberId,
]);