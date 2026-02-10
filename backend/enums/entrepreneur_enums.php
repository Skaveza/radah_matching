<?php
// entrepreneur_enums.php

class EntrepreneurEnums
{
    // Entrepreneur account level
    public static array $BUSINESS_TYPES = [
        "saas",          // Software as a Service
        "ecommerce",     // Online Store
        "marketplace",   // Buyers & sellers
        "other"
    ];

    // Project stage
    public static array $PROJECT_STAGES = [
        "idea",
        "mvp",
        "launch",
        "growth"
    ];

    // Project industries
    public static array $PROJECT_INDUSTRIES = [
        "fintech",
        "healthcare",
        "education",
        "ecommerce",
        "real_estate",
        "software",
        "media_entertainment",
        "food_beverage",
        "hr_recruitment",
        "legal",
        "logistics_supply_chain",
        "travel_hospitality",
        "marketing_advertising",
        "other"
    ];

    // Target timeline
    public static array $TARGET_TIMELINES = [
        "asap",
        "1_2_weeks",
        "within_a_month",
        "just_exploring"
    ];

    // Monthly budget range
    public static array $BUDGET_RANGES = [
        "under_5000",
        "5000_10000",
        "10000_25000",
        "25000_50000",
        "50000_plus"
    ];
}