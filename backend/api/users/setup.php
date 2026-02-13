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
$authUser = $mw->verifyToken(); // any logged-in user
$uid = $authUser["uid"];

$body = json_decode(file_get_contents("php://input"), true);
if (!is_array($body)) json_response(["success"=>false,"error"=>"Invalid JSON"], 400);

$name = trim($body["name"] ?? "");
$email = trim($authUser["email"] ?? ($body["email"] ?? ""));
$role = trim($body["role"] ?? "");
$region = trim($body["region"] ?? "");

if ($name === "" || $role === "" || $region === "") {
  json_response(["success"=>false,"error"=>"Missing fields: name,role,region"], 422);
}
if ($email === "") {
  json_response(["success"=>false,"error"=>"Missing email (Firebase user email not found)"], 422);
}

if (!in_array($role, ["entrepreneur","professional"], true)) {
  json_response(["success"=>false,"error"=>"Invalid role"], 422);
}

$firestore = new FirestoreService();

// 1) Create/merge users/{uid}
$userRef = $firestore->collection("users")->document($uid);

$baseUser = [
  "uid" => $uid,
  "name" => $name,
  "email" => $email,
  "role" => $role,
  "region" => $region,
  "created_at" => date("c"),
];

if ($role === "entrepreneur") {
  $baseUser["projects_created"] = 0;
  $baseUser["max_projects"] = 1;
  $baseUser["plan"] = "starter";
  $baseUser["payment_status"] = "inactive";
}

if ($role === "professional") {
  $baseUser["professional_status"] = "pending";
}

$userRef->set($baseUser, ["merge" => true]);

// 2) If professional: create professionals/{uid}
if ($role === "professional") {
  $proRef = $firestore->collection("professionals")->document($uid);

  $professionalDoc = [
    "uid" => $uid,
    "name" => $name,
    "email" => $email,
    "region" => $region,

    // application fields (optional if you collect them on signup)
    "primary_role" => $body["primary_role"] ?? null,
    "professional_summary" => $body["professional_summary"] ?? null,
    "industry_experience" => $body["industry_experience"] ?? [],
    "years_experience" => $body["years_experience"] ?? null,
    "availability" => $body["availability"] ?? null,
    "hourly_rate_range" => $body["hourly_rate_range"] ?? null,
    "linkedin" => $body["linkedin"] ?? null,
    "phone" => $body["phone"] ?? null,
    "portfolio" => $body["portfolio"] ?? null,

    "approved" => false,
    "status" => "pending",
    "created_at" => date("c"),
  ];

  $proRef->set($professionalDoc, ["merge" => true]);
}

json_response(["success"=>true, "message"=>"Profile setup complete", "uid"=>$uid, "role"=>$role]);
