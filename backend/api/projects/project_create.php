<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';
require __DIR__ . '/../../validators.php';
require __DIR__ . '/../../entrepreneur_enums.php';
require __DIR__ . '/../../recommendation_engine.php';

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
if (!is_array($data)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

$required = ["business_type","project_stage","industry","timeline","budget_range","description"];
$missing = Validators::required($data, $required);
if ($missing) json_response(["success"=>false,"error"=>"Missing fields","missing"=>$missing], 422);

// Enum validation
Validators::assertInEnum($data["business_type"], EntrepreneurEnums::$BUSINESS_TYPES, "business_type");
Validators::assertInEnum($data["project_stage"], EntrepreneurEnums::$PROJECT_STAGES, "project_stage");
Validators::assertInEnum($data["industry"], EntrepreneurEnums::$INDUSTRIES, "industry");
Validators::assertInEnum($data["timeline"], EntrepreneurEnums::$TIMELINES, "timeline");
Validators::assertInEnum($data["budget_range"], EntrepreneurEnums::$BUDGET_RANGES, "budget_range");

$firestore = new FirestoreService();

// optional: enforce plan rules
$userData = $authUser["userDoc"];
$maxProjects = $userData["max_projects"] ?? 1;
$projectsCreated = $userData["projects_created"] ?? 0;

// You can remove this if project creation should be allowed before payment
// if (($userData["payment_status"] ?? "inactive") !== "active") json_response(["success"=>false,"error"=>"Payment required"], 403);

if ($projectsCreated >= $maxProjects) json_response(["success"=>false,"error"=>"Project limit reached"], 403);

$project = [
  "entrepreneur_id" => $entrepreneurId,
  "business_type" => trim($data["business_type"]),
  "project_stage" => trim($data["project_stage"]),
  "industry" => trim($data["industry"]),
  "timeline" => trim($data["timeline"]),
  "budget_range" => trim($data["budget_range"]),
  "description" => trim($data["description"]),
  "status" => "draft",
  "payment_status" => "unpaid",
  "unlocked" => false,
  "created_at" => date("c"),
];

$ref = $firestore->collection("projects")->add($project);
$projectId = $ref->id();

$firestore->collection("users")->document($entrepreneurId)->update([
  ['path' => 'projects_created', 'value' => $projectsCreated + 1]
]);

$recommendations = RecommendationEngine::generate($project);

$firestore->collection("project_recommendations")->document($projectId)->set([
  "project_id" => $projectId,
  "recommendations" => $recommendations,
  "created_at" => date("c")
]);

json_response(["success"=>true,"project_id"=>$projectId]);
