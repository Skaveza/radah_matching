<?php

// Set safe server defaults so bootstrap.php doesn't
// try to do anything HTTP-specific
$_SERVER['REQUEST_METHOD'] ??= 'GET';
$_SERVER['HTTP_ORIGIN']    ??= '';

// Load composer autoloader (bootstrap.php will also call this — harmless)
require __DIR__ . '/../vendor/autoload.php';

// Load .env if it exists (same as bootstrap.php does)
if (file_exists(__DIR__ . '/../.env')) {
    $dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
    $dotenv->load();
}

define('APP_ENV', 'testing');
