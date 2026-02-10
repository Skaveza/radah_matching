<?php

require __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

$dotenvPath = __DIR__;

if (file_exists($dotenvPath . '/.env')) {
    $dotenv = Dotenv::createImmutable($dotenvPath);
    $dotenv->load();
}
