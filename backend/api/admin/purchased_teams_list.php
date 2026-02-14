<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["admin"]); // ✅ admin only

$firestore = new FirestoreService();

/**
 * We treat "purchased team" as:
 * - a project with unlocked = true
 * This is consistent with your recommendation endpoint masking logic:
 * - if project.unlocked == false -> mask contacts
 */
try {
  $projectsDocs = $firestore->collection("projects")
    ->where("unlocked", "=", true)
    ->documents();

  $items = [];

  foreach ($projectsDocs as $doc) {
    $p = $doc->data();
    $projectId = $doc->id();

    $entrepreneurId = $p["entrepreneur_id"] ?? null;

    // Try load entrepreneur profile (users collection)
    $entrepreneur = null;
    if ($entrepreneurId) {
      try {
        $uSnap = $firestore->collection("users")->document($entrepreneurId)->snapshot();
        if ($uSnap && $uSnap->exists()) $entrepreneur = $uSnap->data();
      } catch (\Throwable $e) {
        $entrepreneur = null;
      }
    }

    // Load saved team (project_teams/{projectId})
    $team = [];
    try {
      $tSnap = $firestore->collection("project_teams")->document($projectId)->snapshot();
      if ($tSnap && $tSnap->exists()) {
        $tDoc = $tSnap->data();
        $team = $tDoc["team"] ?? [];
      }
    } catch (\Throwable $e) {
      $team = [];
    }

    $items[] = [
      "project_id" => $projectId,
      "industry" => $p["industry"] ?? null,
      "region" => $p["region"] ?? null,
      "budget_range" => $p["budget_range"] ?? null,
      "project_stage" => $p["project_stage"] ?? null,
      "created_at" => $p["created_at"] ?? null,
      "updated_at" => $p["updated_at"] ?? null,
      "unlocked" => (bool)($p["unlocked"] ?? false),

      "entrepreneur" => $entrepreneur ? [
        "uid" => $entrepreneurId,
        "name" => $entrepreneur["name"] ?? null,
        "email" => $entrepreneur["email"] ?? null,
        "region" => $entrepreneur["region"] ?? null,
        "role" => $entrepreneur["role"] ?? null,
      ] : [
        "uid" => $entrepreneurId,
        "name" => null,
        "email" => null,
        "region" => null,
        "role" => null,
      ],

      "team" => $team,
      "team_size" => is_array($team) ? count($team) : 0,
    ];
  }

  // Sort newest first
  usort($items, function($a, $b) {
    return strcmp((string)($b["updated_at"] ?? $b["created_at"] ?? ""), (string)($a["updated_at"] ?? $a["created_at"] ?? ""));
  });

  json_response([
    "success" => true,
    "count" => count($items),
    "items" => $items
  ]);
} catch (\Throwable $e) {
  json_response(["success" => false, "error" => "Failed to list purchased teams"], 500);
}
