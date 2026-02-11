<?php

require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';
require __DIR__ . '/validators.php';
require __DIR__ . '/entrepreneur_enums.php';
require __DIR__ . '/recommendation_engine.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200)
{
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

function get_json_body(): array
{
    $raw = file_get_contents("php://input");
    $decoded = json_decode($raw, true);

    if (!is_array($decoded)) {
        json_response([
            "success" => false,
            "error" => "Invalid JSON body"
        ], 400);
    }

    return $decoded;
}

try {
    $data = get_json_body();

    // 1 Required fields
    $required = [
        "entrepreneur_id",
        "business_type",
        "project_stage",
        "industry",
        "timeline",
        "budget_range",
        "description"
    ];
    $missing = Validators::required($data, $required);
    if (!empty($missing)) {
        json_response([
            "success" => false,
            "error" => "Missing required fields",
            "missing_fields" => $missing
        ], 422);
    }

    // 2 Enum validation
    Validators::assertInEnum($data["business_type"], EntrepreneurEnums::$BUSINESS_TYPES, "business_type");
    Validators::assertInEnum($data["project_stage"], EntrepreneurEnums::$PROJECT_STAGES, "project_stage");
    Validators::assertInEnum($data["industry"], EntrepreneurEnums::$INDUSTRIES, "industry");
    Validators::assertInEnum($data["timeline"], EntrepreneurEnums::$TIMELINES, "timeline");
    Validators::assertInEnum($data["budget_range"], EntrepreneurEnums::$BUDGET_RANGES, "budget_range");

    $firestore = new FirestoreService();

    // 3 Check entrepreneur plan & payment
    $entrepreneurId = trim($data["entrepreneur_id"]);
    $userDoc = $firestore->collection("users")->document($entrepreneurId)->snapshot();

    if (!$userDoc->exists()) {
        json_response([
            "success" => false,
            "error" => "Entrepreneur not found"
        ], 404);
    }

    $userData = $userDoc->data();
    $plan = $userData["plan"] ?? null;
    $maxProjects = $userData["max_projects"] ?? 0;
    $projectsCreated = $userData["projects_created"] ?? 0;
    $paymentStatus = $userData["payment_status"] ?? "inactive";

    if ($paymentStatus !== "active") {
        json_response([
            "success" => false,
            "error" => "Payment required to create a project"
        ], 403);
    }

    if ($projectsCreated >= $maxProjects) {
        json_response([
            "success" => false,
            "error" => "You have reached the maximum number of projects for your plan"
        ], 403);
    }

    // 4 Normalize project data
    $project = [
        "entrepreneur_id" => $entrepreneurId,
        "business_type" => trim($data["business_type"]),
        "project_stage" => trim($data["project_stage"]),
        "industry" => trim($data["industry"]),
        "timeline" => trim($data["timeline"]),
        "budget_range" => trim($data["budget_range"]),
        "description" => trim($data["description"]),
        "status" => "draft",
        "created_at" => date("c")
    ];

    // 5 Save project
    $projects = $firestore->collection("projects");
    $projectRef = $projects->add($project);
    $projectId = $projectRef->id();

    // 6 Update project count
    $firestore->collection("users")->document($entrepreneurId)->update([
        ['path' => 'projects_created', 'value' => $projectsCreated + 1]
    ]);

    // 7 Generate recommendations
    $recommendations = RecommendationEngine::generate($project);

    // 8 Store recommendations snapshot
    $firestore->collection("project_recommendations")->add([
        "project_id" => $projectId,
        "recommendations" => $recommendations,
        "created_at" => date("c")
    ]);

    // 9 Response
    json_response([
        "success" => true,
        "message" => "Project created",
        "project_id" => $projectId,
        "recommendations" => $recommendations
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}