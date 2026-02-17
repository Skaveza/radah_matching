<?php
// bootstrap.php

// ==========================
// CORS + Preflight (OPTIONS)
// ==========================
$allowed_origins = [
  "https://radahworks.com",
  "https://www.radahworks.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Optional: allow origin from env too (nice if you change domains again)
if (!empty($_ENV["FRONTEND_URL"])) {
  $allowed_origins[] = rtrim($_ENV["FRONTEND_URL"], "/");
}

$origin = $_SERVER["HTTP_ORIGIN"] ?? "";

if ($origin && in_array($origin, $allowed_origins, true)) {
  header("Access-Control-Allow-Origin: $origin");
  header("Vary: Origin");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Max-Age: 86400");

// If you use cookies/sessions across domains, uncomment:
// header("Access-Control-Allow-Credentials: true");

if (($_SERVER["REQUEST_METHOD"] ?? "") === "OPTIONS") {
  http_response_code(204);
  exit;
}

// --------------------------
// Existing bootstrap content
// --------------------------
require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

/**
 * Local dev: load .env if present.
 * Production (Render): set env vars in Render dashboard (recommended).
 */
$dotenvPath = __DIR__;
$envFile = $dotenvPath . '/.env';

if (file_exists($envFile)) {
    $dotenv = Dotenv::createImmutable($dotenvPath);
    $dotenv->load();
}

// Optional: normalize $_ENV from getenv() in case some vars are only in getenv()
foreach ([
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_PRICE_BLUEPRINT",
    "STRIPE_PRICE_PRO",
    "STRIPE_PRICE_MEMBERSHIP",
    "FRONTEND_URL",
] as $k) {
    if (!isset($_ENV[$k]) || $_ENV[$k] === "") {
        $v = getenv($k);
        if ($v !== false && $v !== "") $_ENV[$k] = $v;
    }
}
