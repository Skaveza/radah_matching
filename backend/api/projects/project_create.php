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

// Enum validation
if (!Validators::inEnum($data["business_type"], Enums::$BUSINESS_TYPES)) {
  json_response(["success"=>false,"error"=>"Invalid business_type"], 422);
}
if (!Validators::inEnum($data["project_stage"], Enums::$PROJECT_STAGES)) {
  json_response(["success"=>false,"error"=>"Invalid project_stage"], 422);
}
if (!Validators::inEnum($data["industry"], Enums::$INDUSTRIES)) {
  json_response(["success"=>false,"error"=>"Invalid industry"], 422);
}
if (!Validators::inEnum($data["timeline"], Enums::$TIMELINES)) {
  json_response(["success"=>false,"error"=>"Invalid timeline"], 422);
}
if (!Validators::inEnum($data["budget_range"], Enums::$BUDGET_RANGES)) {
  json_response(["success"=>false,"error"=>"Invalid budget_range"], 422);
}

$firestore = new FirestoreService();
$now = date("c");

// -------------------------------
// Plan enforcement (DEV SAFE)
// -------------------------------
$isDev = ($_ENV['APP_ENV'] ?? 'production') === 'local';

$plans = require __DIR__ . '/../plans.php';

$userSnap = $firestore->collection("users")->document($entrepreneurId)->snapshot();
$userDoc = $userSnap->exists() ? $userSnap->data() : [];

$userPlan = $userDoc["plan"] ?? null;
$membershipStatus = $userDoc["membership_status"] ?? null;

// Allow free unlimited in dev
$defaultFreeLimit = $isDev ? 999 : 0;

$projectsLimit = $defaultFreeLimit;

if ($userPlan && isset($plans[$userPlan])) {
  $projectsLimit = $plans[$userPlan]["projects_limit"];
}

$projectsCreated = (int)($userDoc["projects_created"] ?? 0);

// Only enforce in production
if (!$isDev) {
  if ($projectsLimit === -1) {
    if ($membershipStatus !== "active") {
      json_response([
        "success" => false,
        "error" => "Membership inactive",
      ], 403);
    }
  } else {
    if ($projectsCreated >= $projectsLimit) {
      json_response([
        "success" => false,
        "error" => "Project limit reached. Upgrade required.",
      ], 403);
    }
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

  "payment_status" => "unpaid",
  "payment_plan" => null,
  "unlocked" => false,

  "created_at" => $now,
  "updated_at" => $now,
];

$ref = $firestore->collection("projects")->add($project);
$projectId = $ref->id();

// increment counter
$firestore->collection("users")->document($entrepreneurId)->set([
  "projects_created" => $projectsCreated + 1,
  "updated_at" => $now,
], ["merge" => true]);

// Generate recommendations
$recommendations = RecommendationEngine::generate($project);

$firestore->collection("project_recommendations")->document($projectId)->set([
  "project_id" => $projectId,
  "recommendations" => $recommendations,
  "created_at" => $now,
  "updated_at" => $now,
]);

json_response(["success"=>true,"project_id"=>$projectId]);