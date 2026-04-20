<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../api/middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$uid = $authUser["uid"];

// Extract project ID from the URL: /api/projects/{id}
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($path, '/'));
// parts: ['api', 'projects', '{id}']
$projectId = $parts[2] ?? null;

if (!$projectId) {
    json_response(["success" => false, "error" => "Missing project ID"], 400);
}

$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    json_response(["success" => false, "error" => "Invalid JSON body"], 400);
}

$firestore = new FirestoreService();

// Security: verify the project belongs to this user before updating
$projectDoc = $firestore->collection("projects")->document($projectId)->snapshot();
if (!$projectDoc->exists()) {
    json_response(["success" => false, "error" => "Project not found"], 404);
}
$projectData = $projectDoc->data();
if (($projectData["entrepreneur_id"] ?? null) !== $uid) {
    json_response(["success" => false, "error" => "Forbidden"], 403);
}

// Only allow safe fields to be updated (whitelist)
$allowed = [
    'name', 'description', 'stage', 'status',
    'team_completion', 'execution_progress', 'investor_readiness_score',
    'budget_total', 'budget_allocated',
    'problem_statement', 'value_proposition', 'target_market',
    'revenue_model', 'competitive_landscape', 'success_metrics', 'mvp_scope',
];

$update = [];
foreach ($allowed as $field) {
    if (array_key_exists($field, $body)) {
        $update[$field] = $body[$field];
    }
}
$update['updated_at'] = date('c');

$firestore->collection("projects")->document($projectId)->update(
    array_map(fn($k, $v) => ['path' => $k, 'value' => $v], array_keys($update), $update)
);

json_response(["success" => true, "project_id" => $projectId]);