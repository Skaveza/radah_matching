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

// Optional: reuse your discrepancy logic (same as create)
function flag_discrepancy(array $data): array
{
    $flags = [];

    if (!isset($data["email"]) || !Validators::isValidEmail($data["email"])) {
        $flags[] = "invalid_email";
    }

    if (!isset($data["professional_summary"]) || strlen(trim($data["professional_summary"])) < 40) {
        $flags[] = "summary_too_short";
    }

    if (empty($data["industry_experience"])) {
        $flags[] = "missing_industry_experience";
    }

    return $flags;
}

try {
    $id = $_GET["id"] ?? null;
    if (!$id || trim($id) === "") {
        json_response([
            "success" => false,
            "error" => "Missing required query param: id"
        ], 400);
    }
    $id = trim($id);

    $payload = get_json_body();

    $firestore = new FirestoreService();
    $docRef = $firestore->collection("professionals")->document($id);
    $snapshot = $docRef->snapshot();

    if (!$snapshot->exists()) {
        json_response([
            "success" => false,
            "error" => "Professional not found",
            "id" => $id
        ], 404);
    }

    // Existing doc
    $existing = $snapshot->data();

    // Only allow updating specific fields (MVP safe update)
    $allowedUpdates = [
        "full_name",
        "email",
        "primary_role",
        "years_experience",
        "industry_experience",
        "portfolio_url",
        "linkedin_url",
        "hourly_rate_range",
        "availability",
        "professional_summary",
        "status" // admin-controlled
    ];

    $updates = [];

    foreach ($allowedUpdates as $field) {
        if (array_key_exists($field, $payload)) {
            $updates[$field] = $payload[$field];
        }
    }

    if (empty($updates)) {
        json_response([
            "success" => false,
            "error" => "No valid fields provided to update",
            "allowed_fields" => $allowedUpdates
        ], 422);
    }

    // Normalize updates
    if (isset($updates["full_name"])) $updates["full_name"] = trim((string)$updates["full_name"]);
    if (isset($updates["email"])) $updates["email"] = strtolower(trim((string)$updates["email"]));
    if (isset($updates["primary_role"])) $updates["primary_role"] = trim((string)$updates["primary_role"]);
    if (isset($updates["years_experience"])) $updates["years_experience"] = trim((string)$updates["years_experience"]);
    if (isset($updates["hourly_rate_range"])) $updates["hourly_rate_range"] = trim((string)$updates["hourly_rate_range"]);
    if (isset($updates["availability"])) $updates["availability"] = trim((string)$updates["availability"]);
    if (isset($updates["professional_summary"])) $updates["professional_summary"] = trim((string)$updates["professional_summary"]);

    if (isset($updates["portfolio_url"])) {
        $updates["portfolio_url"] = trim((string)$updates["portfolio_url"]);
        if ($updates["portfolio_url"] === "") $updates["portfolio_url"] = null;
    }

    if (isset($updates["linkedin_url"])) {
        $updates["linkedin_url"] = trim((string)$updates["linkedin_url"]);
        if ($updates["linkedin_url"] === "") $updates["linkedin_url"] = null;
    }

    if (isset($updates["industry_experience"])) {
        $updates["industry_experience"] = Validators::ensureArray($updates["industry_experience"]);
    }

    // Validate enums only if they were updated
    if (isset($updates["primary_role"]) && !Validators::inEnum($updates["primary_role"], ProfessionalEnums::$PRIMARY_ROLES)) {
        json_response([
            "success" => false,
            "error" => "Invalid primary_role",
            "allowed" => ProfessionalEnums::$PRIMARY_ROLES
        ], 422);
    }

    if (isset($updates["years_experience"]) && !Validators::inEnum($updates["years_experience"], ProfessionalEnums::$YEARS_EXPERIENCE)) {
        json_response([
            "success" => false,
            "error" => "Invalid years_experience",
            "allowed" => ProfessionalEnums::$YEARS_EXPERIENCE
        ], 422);
    }

    if (isset($updates["hourly_rate_range"]) && !Validators::inEnum($updates["hourly_rate_range"], ProfessionalEnums::$HOURLY_RATE_RANGE)) {
        json_response([
            "success" => false,
            "error" => "Invalid hourly_rate_range",
            "allowed" => ProfessionalEnums::$HOURLY_RATE_RANGE
        ], 422);
    }

    if (isset($updates["availability"]) && !Validators::inEnum($updates["availability"], ProfessionalEnums::$AVAILABILITY)) {
        json_response([
            "success" => false,
            "error" => "Invalid availability",
            "allowed" => ProfessionalEnums::$AVAILABILITY
        ], 422);
    }

    if (isset($updates["industry_experience"])) {
        foreach ($updates["industry_experience"] as $ind) {
            if (!Validators::inEnum($ind, ProfessionalEnums::$INDUSTRY_EXPERIENCE)) {
                json_response([
                    "success" => false,
                    "error" => "Invalid industry_experience value: " . $ind,
                    "allowed" => ProfessionalEnums::$INDUSTRY_EXPERIENCE
                ], 422);
            }
        }
    }

    // Merge existing + updates for re-flagging
    $merged = array_merge($existing, $updates);

    // Recompute flags after update
    $flags = flag_discrepancy($merged);

    // If admin manually set status, keep it.
    // Otherwise, auto mark flagged profiles as pending_review
    if (!isset($updates["status"])) {
        if (!empty($flags)) {
            $updates["status"] = "pending_review";
        } else {
            // Keep previous status if already approved
            $updates["status"] = $existing["status"] ?? "approved";
        }
    }

    $updates["flags"] = $flags;
    $updates["updated_at"] = date("c");

    // Save update to Firestore
    $docRef->set($updates, ["merge" => true]);

    json_response([
        "success" => true,
        "message" => "Professional updated",
        "id" => $id,
        "updated_fields" => array_keys($updates),
        "status" => $updates["status"],
        "flags" => $flags
    ]);

} catch (Exception $e) {
    json_response([
        "success" => false,
        "error" => "Server error",
        "details" => $e->getMessage()
    ], 500);
}
