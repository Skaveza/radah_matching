<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';
require __DIR__ . '/validators.php';
require __DIR__ . '/professional_enums.php';
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

/**
 * Basic rule: suspicious hourly rate vs experience
 */
function is_suspicious_rate_vs_experience(string $years, string $rate): bool
{
    // If rate is 200+ and experience is low -> suspicious
    if ($rate === "200_plus" && in_array($years, ["1_3", "3_5"], true)) {
        return true;
    }

    // If rate is 150-200 and experience is 1-3 -> suspicious
    if ($rate === "150_200" && $years === "1_3") {
        return true;
    }

    return false;
}

function flag_discrepancy(array $data): array
{
    $flags = [];

    // invalid email
    if (!Validators::isValidEmail($data["email"])) {
        $flags[] = "invalid_email";
    }

    // summary too short
    if (strlen(trim($data["professional_summary"])) < 40) {
        $flags[] = "summary_too_short";
    }

    // missing industry experience
    if (empty($data["industry_experience"])) {
        $flags[] = "missing_industry_experience";
    }

    // suspicious hourly rate vs experience
    if (is_suspicious_rate_vs_experience($data["years_experience"], $data["hourly_rate_range"])) {
        $flags[] = "suspicious_rate_vs_experience";
    }

    return $flags;
}

try {
    $data = get_json_body();

    $requiredFields = [
        "full_name",
        "email",
        "primary_role",
        "years_experience",
        "industry_experience",
        "hourly_rate_range",
        "availability",
        "professional_summary"
    ];

    $missing = Validators::required($data, $requiredFields);

    if (!empty($missing)) {
        json_response([
            "success" => false,
            "error" => "Missing required fields",
            "missing_fields" => $missing
        ], 422);
    }

    // Normalize fields
    $data["full_name"] = trim($data["full_name"]);
    $data["email"] = strtolower(trim($data["email"]));
    $data["primary_role"] = trim($data["primary_role"]);
    $data["years_experience"] = trim($data["years_experience"]);
    $data["hourly_rate_range"] = trim($data["hourly_rate_range"]);
    $data["availability"] = trim($data["availability"]);
    $data["professional_summary"] = trim($data["professional_summary"]);

    $data["portfolio_url"] = isset($data["portfolio_url"]) ? trim((string)$data["portfolio_url"]) : null;
    $data["linkedin_url"] = isset($data["linkedin_url"]) ? trim((string)$data["linkedin_url"]) : null;

    $data["industry_experience"] = Validators::ensureArray($data["industry_experience"]);

    // Enum validation
    if (!Validators::inEnum($data["primary_role"], ProfessionalEnums::$PRIMARY_ROLES)) {
        json_response([
            "success" => false,
            "error" => "Invalid primary_role",
            "allowed" => ProfessionalEnums::$PRIMARY_ROLES
        ], 422);
    }

    if (!Validators::inEnum($data["years_experience"], ProfessionalEnums::$YEARS_EXPERIENCE)) {
        json_response([
            "success" => false,
            "error" => "Invalid years_experience",
            "allowed" => ProfessionalEnums::$YEARS_EXPERIENCE
        ], 422);
    }

    if (!Validators::inEnum($data["hourly_rate_range"], ProfessionalEnums::$HOURLY_RATE_RANGE)) {
        json_response([
            "success" => false,
            "error" => "Invalid hourly_rate_range",
            "allowed" => ProfessionalEnums::$HOURLY_RATE_RANGE
        ], 422);
    }

    if (!Validators::inEnum($data["availability"], ProfessionalEnums::$AVAILABILITY)) {
        json_response([
            "success" => false,
            "error" => "Invalid availability",
            "allowed" => ProfessionalEnums::$AVAILABILITY
        ], 422);
    }

    // Validate industries are in allowed list
    foreach ($data["industry_experience"] as $ind) {
        if (!Validators::inEnum($ind, ProfessionalEnums::$INDUSTRY_EXPERIENCE)) {
            json_response([
                "success" => false,
                "error" => "Invalid industry_experience value: " . $ind,
                "allowed" => ProfessionalEnums::$INDUSTRY_EXPERIENCE
            ], 422);
        }
    }

    // Pending Review
    $flags = flag_discrepancy($data);

    $status = "approved";
    if (!empty($flags)) {
        $status = "pending_review";
    }

    $doc = [
        "full_name" => $data["full_name"],
        "email" => $data["email"],
        "primary_role" => $data["primary_role"],
        "years_experience" => $data["years_experience"],
        "industry_experience" => $data["industry_experience"],
        "portfolio_url" => $data["portfolio_url"],
        "linkedin_url" => $data["linkedin_url"],
        "hourly_rate_range" => $data["hourly_rate_range"],
        "availability" => $data["availability"],
        "professional_summary" => $data["professional_summary"],
        "status" => $status,
        "flags" => $flags,
        "created_at" => date("c"),
        "updated_at" => date("c")
    ];

    $firestore = new FirestoreService();

    // Save professional
    $professionals = $firestore->collection("professionals");
    $newDocRef = $professionals->add($doc);
    $newId = $newDocRef->id();

    // Admin Queue: if flagged, create notification doc
    if (!empty($flags)) {
        $adminQueue = $firestore->collection("admin_notifications");

        $adminQueue->add([
            "type" => "professional_needs_review",
            "professional_id" => $newId,
            "professional_email" => $data["email"],
            "flags" => $flags,
            "status" => "unread",
            "created_at" => date("c")
        ]);
    }

    json_response([
        "success" => true,
        "message" => "Professional profile created",
        "professional_id" => $newId,
        "status" => $status,
        "flags" => $flags
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}
