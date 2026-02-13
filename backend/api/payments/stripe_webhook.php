<?php
require __DIR__ . '/../../bootstrap.php';
require __DIR__ . '/../../firestore_service.php';
require __DIR__ . '/../../vendor/autoload.php';

use Stripe\Stripe;
use Stripe\Webhook;

$secret = $_ENV["STRIPE_WEBHOOK_SECRET"] ?? null;
if (!$secret) {
  http_response_code(500);
  echo "Missing STRIPE_WEBHOOK_SECRET";
  exit;
}

$payload = @file_get_contents("php://input");
$sig = $_SERVER["HTTP_STRIPE_SIGNATURE"] ?? "";

try {
  Stripe::setApiKey($_ENV["STRIPE_SECRET_KEY"] ?? "");
  $event = Webhook::constructEvent($payload, $sig, $secret);
} catch (\Throwable $e) {
  http_response_code(400);
  echo "Webhook error";
  exit;
}

$firestore = new FirestoreService();

if ($event->type === "checkout.session.completed") {
  $session = $event->data->object;

  $projectId = $session->metadata->project_id ?? null;

  if ($projectId) {
    // Unlock project
    $firestore->collection("projects")->document($projectId)->update([
      ['path' => 'unlocked', 'value' => true],
      ['path' => 'payment_status', 'value' => 'paid'],
    ]);

    // Unlock team
    $firestore->collection("project_teams")->document($projectId)->set([
      'locked' => false
    ], ['merge' => true]);
  }
}

http_response_code(200);
echo "ok";
