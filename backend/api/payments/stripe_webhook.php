<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';
require __DIR__ . '/vendor/autoload.php';

use Stripe\Webhook;
use Stripe\Stripe;
use Stripe\Checkout\Session;

header("Content-Type: application/json");

$payload = @file_get_contents('php://input');
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpointSecret = $_ENV['STRIPE_WEBHOOK_SECRET'];

$firestore = new FirestoreService();

try {
    Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

    $event = Webhook::constructEvent($payload, $sigHeader, $endpointSecret);

    switch ($event->type) {
        case 'checkout.session.completed':
            $session = $event->data->object;
            $entrepreneurId = $session->metadata->entrepreneur_id ?? null;

            if ($entrepreneurId) {
                // Update user payment status to active
                $firestore->collection('users')->document($entrepreneurId)->update([
                    ['path' => 'payment_status', 'value' => 'active']
                ]);
            }
            break;

        case 'invoice.payment_failed':
            $session = $event->data->object;
            $entrepreneurId = $session->customer_email ?? null;

            if ($entrepreneurId) {
                // Optional: set payment_status to inactive
                $firestore->collection('users')->document($entrepreneurId)->update([
                    ['path' => 'payment_status', 'value' => 'inactive']
                ]);
            }
            break;

        // You can handle more Stripe events like subscription updates, cancellations, etc.

        default:
            // Unexpected event type
            http_response_code(200);
            exit;
    }

    http_response_code(200);

} catch (\Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}