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

// JSON body or POST form
$bodyJson = json_decode(file_get_contents("php://input"), true);
$data = is_array($bodyJson) ? array_merge($_POST, $bodyJson) : $_POST;

$required = ['team_id', 'professional_id', 'entrepreneur_id'];
$missing = array_filter($required, fn($f) => !isset($data[$f]) || $data[$f] === '');
if (!empty($missing)) {
    json_response([
        'success' => false,
        'error' => 'Missing required fields',
        'missing' => array_values($missing),
    ], 400);
}

$teamId         = $data['team_id'];
$professionalId = $data['professional_id'];
$entrepreneurId = $data['entrepreneur_id'];
$role           = $data['role'] ?? 'member';

$firestore = new FirestoreService();

//  Check entrepreneur payment status
$userDoc = $firestore->collection('entrepreneurs')->document($entrepreneurId)->snapshot();
if (!$userDoc->exists() || ($userDoc->data()['payment_status'] ?? '') !== 'active') {
    json_response([
        'success' => false,
        'error' => 'Payment required to invite professionals'
    ], 403);
}

$statuses = require __DIR__ . '/../../enums/team_status_enums.php';
$statusInvited = $statuses['INVITED'] ?? 'invited';

// Create a new team member invitation
$membersRef = $firestore->collection('project_team_members');
$docRef = $membersRef->add([
    'team_id'         => $teamId,
    'professional_id' => $professionalId,
    'entrepreneur_id' => $entrepreneurId,
    'role'            => $role,
    'status'          => $statusInvited,
    'created_at'      => date('c'),
]);

json_response([
    'success'        => true,
    'status'         => $statusInvited,
    'team_member_id' => $docRef->id(),
]);
