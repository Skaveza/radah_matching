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

function require_field(array $body, string $field) {
  if (!isset($body[$field])) return false;
  $v = $body[$field];
  if (is_array($v)) return count($v) > 0;
  return trim((string)$v) !== "";
}

$mw = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["professional"]);
$uid = $authUser["uid"];
$userDoc = $authUser["userDoc"] ?? [];

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

// Make linkedin + phone required
$required = [
  "primary_role",
  "years_experience",
  "industry_experience",
  "hourly_rate_range",
  "availability",
  "professional_summary",
  "linkedin",
  "phone",
];

foreach ($required as $f) {
  if (!require_field($body, $f)) {
    json_response(["success"=>false,"error"=>"Missing field: $f"], 422);
  }
}

$primary_role      = trim((string)$body["primary_role"]);
$years_experience  = trim((string)$body["years_experience"]);
$hourly_rate_range = trim((string)$body["hourly_rate_range"]);
$availability      = trim((string)$body["availability"]);

must_be_in(ProfessionalEnums::$PRIMARY_ROLES, $primary_role, "primary_role");
must_be_in(ProfessionalEnums::$YEARS_EXPERIENCE, $years_experience, "years_experience");
must_be_in(ProfessionalEnums::$HOURLY_RATE_RANGE, $hourly_rate_range, "hourly_rate_range");
must_be_in(ProfessionalEnums::$AVAILABILITY, $availability, "availability");

$industry_experience = $body["industry_experience"];
if (!is_array($industry_experience) || count($industry_experience) === 0) {
  json_response(["success"=>false,"error"=>"industry_experience must be a non-empty array"], 422);
}
foreach ($industry_experience as $ind) {
  must_be_in(ProfessionalEnums::$INDUSTRY_EXPERIENCE, $ind, "industry_experience");
}

// basic URL check for linkedin (optional stricter)
$linkedin = trim((string)$body["linkedin"]);
if (!filter_var($linkedin, FILTER_VALIDATE_URL)) {
  json_response(["success"=>false,"error"=>"linkedin must be a valid URL"], 422);
}

$phone = trim((string)$body["phone"]);

$firestore = new FirestoreService();
$now = date("c");

// Save professionals/{uid}
$firestore->collection("professionals")->document($uid)->set([
  "uid" => $uid,
  "name" => $userDoc["name"] ?? null,
  "email" => $userDoc["email"] ?? null,
  "region" => $userDoc["region"] ?? null,

  "primary_role" => $primary_role,
  "years_experience" => $years_experience,
  "industry_experience" => array_values($industry_experience),
  "hourly_rate_range" => $hourly_rate_range,
  "availability" => $availability,
  "professional_summary" => trim((string)$body["professional_summary"]),

  // consistent field names
  "portfolio" => $body["portfolio"] ?? null,
  "linkedin" => $linkedin,
  "phone" => $phone,

  "status" => "pending",
  "approved" => false,
  "rejected" => false,

  "updated_at" => $now,
  // don't overwrite created_at if exists
], ["merge" => true]);

// Update users/{uid}
$firestore->collection("users")->document($uid)->set([
  "professional_status" => "pending",
  "updated_at" => $now
], ["merge" => true]);

json_response(["success"=>true, "message"=>"Application submitted", "uid"=>$uid, "status"=>"pending"]);
