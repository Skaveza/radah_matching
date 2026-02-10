<?php
// enums.php

class Enums
{
    public static array $BUSINESS_TYPES = ["saas", "ecommerce", "marketplace", "other"];
    public static array $PROJECT_STAGES = ["idea", "mvp", "launch", "growth"];

    public static array $INDUSTRIES = [
        "fintech", "healthcare", "education", "ecommerce", "real_estate", "software",
        "media_entertainment", "food_beverage", "hr_recruitment", "legal", "logistics_supply_chain",
        "travel_hospitality", "marketing_advertising", "other"
    ];

    public static array $TIMELINES = ["asap", "1_2_weeks", "within_a_month", "just_exploring"];

    public static array $BUDGET_RANGES = [
        "under_5000",
        "5000_10000",
        "10000_25000",
        "25000_50000",
        "50000_plus"
    ];

    public static array $PRO_ROLES = [
        "technical_lead",
        "fullstack_developer",
        "frontend_developer",
        "backend_developer",
        "uiux_designer",
        "product_manager",
        "devops_engineer",
        "qa_engineer",
        "marketing_strategist",
        "content_writer",
        "data_analyst"
    ];

    public static array $YEARS_EXPERIENCE = ["1_3", "3_5", "5_7", "7_10", "10_plus"];
    public static array $AVAILABILITY = ["full_time", "part_time", "limited", "project_based"];
}
