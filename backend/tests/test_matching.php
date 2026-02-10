#!/usr/bin/env php
<?php
// test_matching.php

require __DIR__ . '/bootstrap.php';
require_once __DIR__ . "/matching_engine.php";

$project = [
    "description" => "My project is a soil moisture data platform that uses NASA satellite data to predict the future soil moisture in arid and semi arid areas. Success means farmers in NorthEastern Kenya receive timely messages. The technical requirements are machine learning, data analysis, web development and cyber security.",
    "industry" => "other",
    "budget_range" => "5000_10000"
];

$professionals = [
    [
        "id" => "pro_1",
        "full_name" => "Jane Doe",
        "primary_role" => "data_analyst",
        "years_experience" => "3_5",
        "industry_experience" => ["agriculture", "software"],
        "hourly_rate_range" => "75-100",
        "availability" => "part_time",
        "professional_summary" => "I am a data analyst with experience in data analysis, dashboards, forecasting, and ML models using Python."
    ],
    [
        "id" => "pro_2",
        "full_name" => "Mark Dev",
        "primary_role" => "frontend_developer",
        "years_experience" => "5_7",
        "industry_experience" => ["software"],
        "hourly_rate_range" => "75-100",
        "availability" => "full_time",
        "professional_summary" => "Frontend developer specializing in React, UI systems, and modern web development."
    ],
    [
        "id" => "pro_3",
        "full_name" => "Ali Secure",
        "primary_role" => "devops_engineer",
        "years_experience" => "7_10",
        "industry_experience" => ["software"],
        "hourly_rate_range" => "100-150",
        "availability" => "limited",
        "professional_summary" => "DevOps and security engineer focused on cybersecurity, cloud deployments, and secure infrastructure."
    ],
    [
        "id" => "pro_4",
        "full_name" => "Grace UX",
        "primary_role" => "uiux_designer",
        "years_experience" => "3_5",
        "industry_experience" => ["software", "healthcare"],
        "hourly_rate_range" => "50-75",
        "availability" => "part_time",
        "professional_summary" => "UI/UX designer with strong product thinking, user research, and Figma prototyping."
    ],
];

$result = MatchingEngine::generateTeam($project, $professionals, 4);

echo json_encode($result, JSON_PRETTY_PRINT) . PHP_EOL;
