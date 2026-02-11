#!/usr/bin/env php
<?php
require __DIR__ . '/bootstrap.php';
require __DIR__ . '/firestore_service.php';

$firestore = new FirestoreService();

echo "=== Firestore Test Seed ===\n";

/**
 * ----------------------------
 * 1. Entrepreneurs (Users)
 * ----------------------------
 */
$entrepreneurs = [
    [
        "id" => "ent_blueprint",
        "name" => "Test Entrepreneur Blueprint",
        "plan" => "blueprint",
        "max_projects" => 1,
        "projects_created" => 0,
        "payment_status" => "inactive",
        "stripe_customer_id" => "",
        "stripe_subscription_id" => ""
    ],
    [
        "id" => "ent_pro",
        "name" => "Test Entrepreneur Pro",
        "plan" => "pro",
        "max_projects" => 5,
        "projects_created" => 0,
        "payment_status" => "active",
        "stripe_customer_id" => "",
        "stripe_subscription_id" => ""
    ],
    [
        "id" => "ent_subscription",
        "name" => "Test Entrepreneur Subscription",
        "plan" => "subscription",
        "max_projects" => 10,
        "projects_created" => 0,
        "payment_status" => "active",
        "stripe_customer_id" => "",
        "stripe_subscription_id" => ""
    ]
];

foreach ($entrepreneurs as $ent) {
    $firestore->collection('users')->document($ent['id'])->set($ent);
    echo " Entrepreneur {$ent['id']} created\n";
}

/**
 * ----------------------------
 * 2. Professionals
 * ----------------------------
 */
$professionals = [
    [
        "id" => "pro_1",
        "full_name" => "Jane Doe",
        "email" => "jane@test.com",
        "phone" => "0700000001",
        "linkedin" => "linkedin.com/janedoe",
        "primary_role" => "data_analyst",
        "status" => "approved",
        "hourly_rate_range" => "75-100",
        "availability" => "part_time",
        "professional_summary" => "Experienced data analyst in AI and fintech"
    ],
    [
        "id" => "pro_2",
        "full_name" => "Mark Dev",
        "email" => "mark@test.com",
        "phone" => "0700000002",
        "linkedin" => "linkedin.com/markdev",
        "primary_role" => "frontend_developer",
        "status" => "approved",
        "hourly_rate_range" => "75-100",
        "availability" => "full_time",
        "professional_summary" => "Frontend developer specializing in React"
    ],
    [
        "id" => "pro_3",
        "full_name" => "Ali Secure",
        "email" => "ali@test.com",
        "phone" => "0700000003",
        "linkedin" => "linkedin.com/aliseure",
        "primary_role" => "devops_engineer",
        "status" => "approved",
        "hourly_rate_range" => "100-150",
        "availability" => "limited",
        "professional_summary" => "DevOps and security engineer"
    ]
];

foreach ($professionals as $pro) {
    $firestore->collection('professionals')->document($pro['id'])->set($pro);
    echo "Professional {$pro['id']} created\n";
}

echo "\n=== Firestore Seeding Complete ===\n";