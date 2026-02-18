<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../middlewear/firebase_middlewear_v2.php';
require __DIR__ . '/../../enums/professional_enums.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
  http_response_code($code);
  echo json_encode($data, JSON_PRETTY_PRINT);
  exit;
}

function must_be_in(array $allowed, $value, string $field) {
  if (!in_array($value, $allowed, true)) {
    json_response(["success"=>false,"error"=>"Invalid $field","allowed"=>$allowed], 422);
  }
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["professional"]);
$uid = $authUser["uid"];

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

$allowed = [
  "primary_role",
  "years_experience",
  "industry_experience",
  "hourly_rate_range",
  "availability",
  "professional_summary",
  "linkedin",
  "phone",
  "portfolio",
  "is_available"
];

$updates = [];
foreach ($allowed as $k) {
  if (array_key_exists($k, $body)) $updates[$k] = $body[$k];
}
if (empty($updates)) json_response(["success"=>false,"error"=>"No valid fields provided"], 422);

// normalize + validate enums if present
if (isset($updates["primary_role"])) {
  $updates["primary_role"] = trim((string)$updates["primary_role"]);
  must_be_in(ProfessionalEnums::$PRIMARY_ROLES, $updates["primary_role"], "primary_role");
}
if (isset($updates["years_experience"])) {
  $updates["years_experience"] = trim((string)$updates["years_experience"]);
  must_be_in(ProfessionalEnums::$YEARS_EXPERIENCE, $updates["years_experience"], "years_experience");
}
if (isset($updates["hourly_rate_range"])) {
  $updates["hourly_rate_range"] = trim((string)$updates["hourly_rate_range"]);
  must_be_in(ProfessionalEnums::$HOURLY_RATE_RANGE, $updates["hourly_rate_range"], "hourly_rate_range");
}
if (isset($updates["availability"])) {
  $updates["availability"] = trim((string)$updates["availability"]);
  must_be_in(ProfessionalEnums::$AVAILABILITY, $updates["availability"], "availability");
}
if (isset($updates["industry_experience"])) {
  if (!is_array($updates["industry_experience"]) || count($updates["industry_experience"]) === 0) {
    json_response(["success"=>false,"error"=>"industry_experience must be a non-empty array"], 422);
  }
  foreach ($updates["industry_experience"] as $ind) {
    must_be_in(ProfessionalEnums::$INDUSTRY_EXPERIENCE, $ind, "industry_experience");
  }
  $updates["industry_experience"] = array_values($updates["industry_experience"]);
}

if (isset($updates["professional_summary"])) $updates["professional_summary"] = trim((string)$updates["professional_summary"]);
if (isset($updates["linkedin"])) $updates["linkedin"] = trim((string)$updates["linkedin"]);
if (isset($updates["phone"])) $updates["phone"] = trim((string)$updates["phone"]);

if (isset($updates["portfolio"])) {
  $updates["portfolio"] = trim((string)$updates["portfolio"]);
  if ($updates["portfolio"] === "") $updates["portfolio"] = null;
}

if (isset($updates["is_available"])) {
  $updates["is_available"] = (bool)$updates["is_available"];
}

try {
  $firestore = new FirestoreService();

  $updates["updated_at"] = date("c");
  $firestore->collection("professionals")->document($uid)->set($updates, ["merge" => true]);

  json_response(["success"=>true,"message"=>"Updated","updated_fields"=>array_keys($updates)]);
} catch (Exception $e) {
  json_response(["success"=>false,"error"=>"Server error","details"=>$e->getMessage()], 500);
}
