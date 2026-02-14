<?php
// bootstrap.php
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
