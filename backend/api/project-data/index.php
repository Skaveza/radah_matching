<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../api/middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

// ── Helpers defined first so they are available everywhere in this file ───────
function json_response(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

function verifyProjectOwnership(FirestoreService $db, string $projectId, string $uid): void {
    $snap = $db->collection("projects")->document($projectId)->snapshot();
    if (!$snap->exists()) {
        json_response(["success" => false, "error" => "Project not found"], 404);
    }
    $data = $snap->data();
    if (($data["entrepreneur_id"] ?? null) !== $uid) {
        json_response(["success" => false, "error" => "Forbidden"], 403);
    }
}

// ── Auth ──────────────────────────────────────────────────────────────────────
$mw       = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$uid      = $authUser["uid"];

// ── Parse URL: /api/project-data/{resource}[/{id}] ───────────────────────────
$path     = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts    = explode('/', trim($path, '/'));
// index:       0      1               2            3
// parts: ['api', 'project-data', '{resource}', '{id?}']
$resource = $parts[2] ?? null;
$id       = $parts[3] ?? null;   // 'bulk' for bulk-create, or a Firestore doc ID
$isBulk   = ($id === 'bulk');
$method   = $_SERVER['REQUEST_METHOD'];

// ── Resource slug → Firestore collection ─────────────────────────────────────
$collections = [
    'team-roles'        => 'team_roles',
    'milestones'        => 'milestones',
    'candidates'        => 'candidates',
    'financial-entries' => 'financial_entries',
    'activities'        => 'activities',
    'saved-documents'   => 'saved_documents',
];

if (!$resource || !isset($collections[$resource])) {
    json_response(["success" => false, "error" => "Unknown resource: $resource"], 404);
}

$collection = $collections[$resource];
$firestore  = new FirestoreService();

// ── GET /api/project-data/{resource}?project_id=xxx ─────────────────────────
if ($method === 'GET') {
    $projectId = $_GET['project_id'] ?? null;
    if (!$projectId) {
        json_response(["success" => false, "error" => "project_id query param required"], 400);
    }
    verifyProjectOwnership($firestore, $projectId, $uid);

    $docs  = $firestore->collection($collection)
                       ->where('project_id', '=', $projectId)
                       ->documents();
    $items = [];
    foreach ($docs as $doc) {
        if ($doc->exists()) {
            $items[] = array_merge(['id' => $doc->id()], $doc->data());
        }
    }
    json_response(["success" => true, "data" => $items]);
}

// ── POST /api/project-data/{resource}/bulk ───────────────────────────────────
if ($method === 'POST' && $isBulk) {
    $body  = json_decode(file_get_contents('php://input'), true);
    $items = $body['items'] ?? [];

    if (empty($items) || !is_array($items)) {
        json_response(["success" => false, "error" => "items array required"], 400);
    }
    $projectId = $items[0]['project_id'] ?? null;
    if (!$projectId) {
        json_response(["success" => false, "error" => "project_id required in items"], 400);
    }
    verifyProjectOwnership($firestore, $projectId, $uid);

    $created = [];
    foreach ($items as $item) {
        $item['created_at'] = date('c');
        $item['updated_at'] = date('c');
        $ref = $firestore->collection($collection)->newDocument();
        $ref->set($item);
        $created[] = array_merge(['id' => $ref->id()], $item);
    }
    json_response(["success" => true, "data" => $created]);
}

// ── POST /api/project-data/{resource} ────────────────────────────────────────
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) {
        json_response(["success" => false, "error" => "Invalid JSON body"], 400);
    }
    $projectId = $body['project_id'] ?? null;
    if (!$projectId) {
        json_response(["success" => false, "error" => "project_id required"], 400);
    }
    verifyProjectOwnership($firestore, $projectId, $uid);

    $body['created_at'] = date('c');
    $body['updated_at'] = date('c');
    $ref = $firestore->collection($collection)->newDocument();
    $ref->set($body);
    json_response(["success" => true, "data" => array_merge(['id' => $ref->id()], $body)]);
}

// ── PUT /api/project-data/{resource}/{id} ────────────────────────────────────
if ($method === 'PUT') {
    if (!$id || $isBulk) {
        json_response(["success" => false, "error" => "Document ID required"], 400);
    }
    $body = json_decode(file_get_contents('php://input'), true);
    if (!$body) {
        json_response(["success" => false, "error" => "Invalid JSON body"], 400);
    }

    $snap = $firestore->collection($collection)->document($id)->snapshot();
    if (!$snap->exists()) {
        json_response(["success" => false, "error" => "Document not found"], 404);
    }
    $projectId = $snap->data()['project_id'] ?? null;
    if ($projectId) {
        verifyProjectOwnership($firestore, $projectId, $uid);
    }

    $body['updated_at'] = date('c');
    unset($body['id']); // never overwrite the Firestore doc ID

    // Build field-path array for partial Firestore update
    $updates = [];
    foreach ($body as $k => $v) {
        $updates[] = ['path' => $k, 'value' => $v];
    }
    $firestore->collection($collection)->document($id)->update($updates);
    json_response(["success" => true, "data" => array_merge(['id' => $id], $body)]);
}

// ── DELETE /api/project-data/{resource}/{id} ─────────────────────────────────
if ($method === 'DELETE') {
    if (!$id || $isBulk) {
        json_response(["success" => false, "error" => "Document ID required"], 400);
    }
    $snap = $firestore->collection($collection)->document($id)->snapshot();
    if (!$snap->exists()) {
        json_response(["success" => false, "error" => "Document not found"], 404);
    }
    $projectId = $snap->data()['project_id'] ?? null;
    if ($projectId) {
        verifyProjectOwnership($firestore, $projectId, $uid);
    }

    $firestore->collection($collection)->document($id)->delete();
    json_response(["success" => true, "deleted" => $id]);
}

json_response(["success" => false, "error" => "Method not allowed"], 405);