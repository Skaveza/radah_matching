<?php
require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../bootstrap.php';


header("Content-Type: application/json");

// CORS (dev)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = [
  'http://localhost:5173',
  'http://localhost:8000'
];


if (in_array($origin, $allowed, true)) {
  header("Access-Control-Allow-Origin: $origin");
}
header("Vary: Origin");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Normalize (optional)
$path = rtrim($path, '/');

// --- Routes ---
$routes = [
  // Auth / User
  ['GET',  '#^/api/me$#', fn() => require __DIR__ . '/../api/me.php'],
  ['POST', '#^/api/verify-user$#', fn() => require __DIR__ . '/../api/verify_user.php'],
  ['POST', '#^/api/users/setup$#', fn() => require __DIR__ . '/../api/users/setup.php'],

  // Projects
  ['POST', '#^/api/projects$#', fn() => require __DIR__ . '/../api/projects/project_create.php'],
  ['GET',  '#^/api/projects$#', fn() => require __DIR__ . '/../api/projects/projects_get.php'],
  ['GET',  '#^/api/projects/([^/]+)/recommendation$#', fn($id) => require __DIR__ . '/../api/projects/project_recommendation_get.php'],

  // Professionals
    // Professionals
    ['POST', '#^/api/professionals/apply$#', fn() => require __DIR__ . '/../api/professionals/professionals_apply.php'],
    ['GET',  '#^/api/professionals/list$#', fn() => require __DIR__ . '/../api/professionals/professionals_list.php'],
    ['GET',  '#^/api/professionals/list-approved$#', fn() => require __DIR__ . '/../api/professionals/professionals_list_approved.php'],
    ['GET',  '#^/api/professionals/list-pending$#', fn() => require __DIR__ . '/../api/professionals/professionals_list_pending.php'],
    ['POST', '#^/api/professionals/approve$#', fn() => require __DIR__ . '/../api/professionals/professional_approve.php'],
    ['POST', '#^/api/professionals/reject$#', fn() => require __DIR__ . '/../api/professionals/professional_reject.php'],
    ['POST', '#^/api/professionals/update$#', fn() => require __DIR__ . '/../api/professionals/professional_update.php'],
    ['POST', '#^/api/professionals/create$#', fn() => require __DIR__ . '/../api/professionals/professional_create.php'],
  

  // Teams
  ['POST', '#^/api/projects/([^/]+)/team/generate$#', fn($id) => require __DIR__ . '/../api/teams/team_generate.php'],
  ['POST', '#^/api/projects/([^/]+)/team/save$#', fn($id) => require __DIR__ . '/../api/projects/project_team_save.php'],

  // Payments
  ['POST', '#^/api/payments/checkout$#', fn() => require __DIR__ . '/../api/payments/create_checkout_session.php'],
  ['POST', '#^/api/payments/webhook$#', fn() => require __DIR__ . '/../api/payments/stripe_webhook.php'],
];

foreach ($routes as [$m, $pattern, $handler]) {
  if ($m === $method && preg_match($pattern, $path, $matches)) {
    array_shift($matches);
    $handler(...$matches);
    exit();
  }
}

http_response_code(404);
echo json_encode(["success" => false, "error" => "Route not found", "path" => $path], JSON_PRETTY_PRINT);
