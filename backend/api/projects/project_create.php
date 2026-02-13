<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';

require __DIR__ . '/../../engines/validators.php';

// Use the correct enums file
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

// optional: enforce plan rules
$userData = $authUser["userDoc"];
$maxProjects = $userData["max_projects"] ?? 1;
$projectsCreated = $userData["projects_created"] ?? 0;

if ($projectsCreated >= $maxProjects) {
  json_response(["success"=>false,"error"=>"Project limit reached"], 403);
}

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
  "unlocked" => false,
  "created_at" => date("c"),
  "updated_at" => date("c"),
];

$ref = $firestore->collection("projects")->add($project);
$projectId = $ref->id();

// increment counter
$firestore->collection("users")->document($entrepreneurId)->update([
  ['path' => 'projects_created', 'value' => $projectsCreated + 1]
]);

// recommendations
$recommendations = RecommendationEngine::generate($project);

$firestore->collection("project_recommendations")->document($projectId)->set([
  "project_id" => $projectId,
  "recommendations" => $recommendations,
  "created_at" => date("c")
]);

json_response(["success"=>true,"project_id"=>$projectId]);
