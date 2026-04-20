<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../api/middlewear/firebase_middlewear_v2.php';

header("Content-Type: application/json");

function json_response($data, int $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

$mw       = new FirebaseMiddlewareV2();
$authUser = $mw->verifyToken(["entrepreneur"]);   // only entrepreneurs can call AI

$body   = json_decode(file_get_contents('php://input'), true);
$prompt = trim($body['prompt'] ?? '');

if (!$prompt) {
    json_response(["success" => false, "error" => "prompt is required"], 400);
}

$apiKey = $_ENV['OPENAI_API_KEY'] ?? getenv('OPENAI_API_KEY');
if (!$apiKey) {
    json_response(["success" => false, "error" => "OpenAI API key not configured"], 500);
}

$payload = json_encode([
    'model'      => 'gpt-4o-mini',
    'messages'   => [
        [
            'role'    => 'system',
            'content' => 'You are a helpful startup advisor. Be concise, direct, and actionable.',
        ],
        [
            'role'    => 'user',
            'content' => $prompt,
        ],
    ],
    'max_tokens'  => 1000,
    'temperature' => 0.7,
]);

$ch = curl_init('https://api.openai.com/v1/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    CURLOPT_TIMEOUT        => 30,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    json_response(["success" => false, "error" => "Network error: $curlErr"], 502);
}

$data = json_decode($response, true);

if ($httpCode !== 200 || !isset($data['choices'][0]['message']['content'])) {
    $errMsg = $data['error']['message'] ?? "OpenAI request failed (HTTP $httpCode)";
    json_response(["success" => false, "error" => $errMsg], 502);
}

$result = $data['choices'][0]['message']['content'];

json_response(["success" => true, "result" => $result]);