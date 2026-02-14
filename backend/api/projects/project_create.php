<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';

require __DIR__ . '/../../engines/validators.php';
require __DIR__ . '/../../enums/project_enums.php';
require __DIR__ . '/../../engines/recommendation_engine.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);
$entrepreneurId = $authUser["uid"];

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) json_response(["success" => false, "error" => "Invalid JSON"], 400);

$required = ["business_type","project_stage","industry","timeline","budget_range","description"];
$missing = Validators::required($data, $required);
if ($missing) json_response(["success" => false, "error" => "Missing fields", "missing" => $missing], 422);

// Enum validation (class is Enums)
if (!Validators::inEnum($data["business_type"], Enums::$BUSINESS_TYPES)) {
  json_response(["success"=>false,"error"=>"Invalid business_type","allowed"=>Enums::$BUSINESS_TYPES], 422);
}
if (!Validators::inEnum($data["project_stage"], Enums::$PROJECT_STAGES)) {
  json_response(["success"=>false,"error"=>"Invalid project_stage","allowed"=>Enums::$PROJECT_STAGES], 422);
}
if (!Validators::inEnum($data["industry"], Enums::$INDUSTRIES)) {
  json_response(["success"=>false,"error"=>"Invalid industry","allowed"=>Enums::$INDUSTRIES], 422);
}
if (!Validators::inEnum($data["timeline"], Enums::$TIMELINES)) {
  json_response(["success"=>false,"error"=>"Invalid timeline","allowed"=>Enums::$TIMELINES], 422);
}
if (!Validators::inEnum($data["budget_range"], Enums::$BUDGET_RANGES)) {
  json_response(["success"=>false,"error"=>"Invalid budget_range","allowed"=>Enums::$BUDGET_RANGES], 422);
}

$firestore = new FirestoreService();
$now = date("c");

// -------------------------------
// ✅ Plan enforcement (server-side)
// -------------------------------
$plans = require __DIR__ . '/../plans.php';

// Load user doc fresh from Firestore (don’t rely only on authUser cached)
$userSnap = $firestore->collection("users")->document($entrepreneurId)->snapshot();
$userDoc = $userSnap->exists() ? $userSnap->data() : [];

$userPlan = $userDoc["plan"] ?? null; // blueprint|pro|membership|null
$membershipStatus = $userDoc["membership_status"] ?? null;

// If you want a free tier, set defaults here.
// For strict paid-only creation: limit 0.
// For allow 1 free project: limit 1.
$defaultFreeLimit = 0;

// Compute projects_limit from plan
$projectsLimit = $defaultFreeLimit;

if ($userPlan && isset($plans[$userPlan])) {
  $projectsLimit = $plans[$userPlan]["projects_limit"];
}

// stored counters (no collection counting)
$projectsCreated = (int)($userDoc["projects_created"] ?? 0);

// membership must be active for unlimited
if ($projectsLimit === -1) {
  if ($membershipStatus !== "active") {
    json_response([
      "success" => false,
      "error" => "Membership inactive. Please renew to create new projects.",
      "code" => "MEMBERSHIP_INACTIVE",
      "plan" => $userPlan,
      "membership_status" => $membershipStatus,
    ], 403);
  }
} else {
  if ($projectsCreated >= $projectsLimit) {
    json_response([
      "success" => false,
      "error" => "Project limit reached. Upgrade required.",
      "code" => "PROJECT_LIMIT_REACHED",
      "projects_created" => $projectsCreated,
      "projects_limit" => $projectsLimit,
      "plan" => $userPlan,
    ], 403);
  }
}

// -------------------------------
// Create project
// -------------------------------
$project = [
  "entrepreneur_id" => $entrepreneurId,
  "business_type" => trim((string)$data["business_type"]),
  "project_stage" => trim((string)$data["project_stage"]),
  "industry" => trim((string)$data["industry"]),
  "timeline" => trim((string)$data["timeline"]),
  "budget_range" => trim((string)$data["budget_range"]),
  "description" => trim((string)$data["description"]),
  "status" => "draft",

  // payment fields
  "payment_status" => "unpaid",
  "payment_plan" => null,
  "unlocked" => false,

  // entitlements snapshot (useful for debugging)
  "creator_plan" => $userPlan,
  "creator_membership_status" => $membershipStatus,

  "created_at" => $now,
  "updated_at" => $now,
];

$ref = $firestore->collection("projects")->add($project);
$projectId = $ref->id();

// increment counter
$firestore->collection("users")->document($entrepreneurId)->set([
  "projects_created" => $projectsCreated + 1,
  "projects_limit" => $projectsLimit, // keep current view
  "updated_at" => $now,
], ["merge" => true]);

// Generate recommendations
$recommendations = RecommendationEngine::generate($project);

// Store recommendations
$firestore->collection("project_recommendations")->document($projectId)->set([
  "project_id" => $projectId,
  "recommendations" => $recommendations,
  "created_at" => $now,
  "updated_at" => $now,
]);

json_response(["success"=>true,"project_id"=>$projectId]);
