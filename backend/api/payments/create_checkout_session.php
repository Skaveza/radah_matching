<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';
require __DIR__ . '/vendor/autoload.php'; // Stripe PHP SDK

\Stripe\Stripe::setApiKey(getenv('STRIPE_SECRET_KEY'));
$payload = @file_get_contents('php://input');
$sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
$endpoint_secret = getenv('STRIPE_WEBHOOK_SECRET');

try {
    $event = \Stripe\Webhook::constructEvent(
        $payload, $sig_header, $endpoint_secret
    );
} catch (\UnexpectedValueException $e) {
    http_response_code(400);
    exit('Invalid payload');
} catch (\Stripe\Exception\SignatureVerificationException $e) {
    http_response_code(400);
    exit('Invalid signature');
}

$firestore = new FirestoreService();

switch ($event->type) {
    // 1. Successful checkout
    case 'checkout.session.completed':
        $session = $event->data->object;
        $entrepreneurId = $session->client_reference_id ?? null;
        if ($entrepreneurId) {
            $firestore->collection('users')->document($entrepreneurId)->update([
                ['path' => 'payment_status', 'value' => 'active']
            ]);
        }
        break;

    // 2. Subscription update (like renewal)
    case 'customer.subscription.updated':
        $subscription = $event->data->object;
        $entrepreneurId = $subscription->metadata->entrepreneur_id ?? null;
        $status = $subscription->status ?? 'inactive';
        if ($entrepreneurId) {
            $firestore->collection('users')->document($entrepreneurId)->update([
                ['path' => 'payment_status', 'value' => $status === 'active' ? 'active' : 'inactive']
            ]);
        }
        break;

    // 3. Payment failure
    case 'invoice.payment_failed':
        $invoice = $event->data->object;
        $entrepreneurId = $invoice->metadata->entrepreneur_id ?? null;
        if ($entrepreneurId) {
            $firestore->collection('users')->document($entrepreneurId)->update([
                ['path' => 'payment_status', 'value' => 'inactive']
            ]);
        }
        break;

    // 4. Cancellations
    case 'customer.subscription.deleted':
        $subscription = $event->data->object;
        $entrepreneurId = $subscription->metadata->entrepreneur_id ?? null;
        if ($entrepreneurId) {
            $firestore->collection('users')->document($entrepreneurId)->update([
                ['path' => 'payment_status', 'value' => 'inactive']
            ]);
        }
        break;

    // 5. Catch-all for other events
    default:
        // Log unknown events to Firestore for admin review
        $firestore->collection('stripe_events')->add([
            'event_type' => $event->type,
            'payload' => json_decode($payload, true),
            'created_at' => date('c')
        ]);
        break;
}

http_response_code(200);