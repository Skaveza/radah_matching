#!/usr/bin/env php
<?php

require __DIR__ . '/bootstrap.php';

echo "APP_ENV: " . ($_ENV['APP_ENV'] ?? 'missing') . PHP_EOL;
echo "FIREBASE_PROJECT_ID: " . ($_ENV['FIREBASE_PROJECT_ID'] ?? 'missing') . PHP_EOL;
echo "CREDENTIALS_PATH: " . ($_ENV['FIREBASE_CREDENTIALS_PATH'] ?? 'missing') . PHP_EOL;
