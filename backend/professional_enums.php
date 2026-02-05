<?php
// Professional requirements
require __DIR__ . '/bootstrap.php';

class ProfessionalEnums
{
    public static array $PRIMARY_ROLES = [
        "technical_lead",
        "full_stack_developer",
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

    public static array $YEARS_EXPERIENCE = [
        "1_3",
        "3_5",
        "5_7",
        "7_10",
        "10_plus"
    ];

    public static array $INDUSTRY_EXPERIENCE = [
        "software_development",
        "fintech",
        "healthcare",
        "ecommerce",
        "edtech",
        "aiml",
        "marketplace",
        "b2b_software",
        "consumer_apps",
        "media_entertainment",
        "gaming",
        "real_estate",
        "cybersecurity",
        "legal_tech",
        "hr_tech",
        "prop_tech",
        "travel_hospitality",
        "logistics_supply_chain"
    ];

    public static array $HOURLY_RATE_RANGE = [
        "50_75",
        "75_100",
        "100_150",
        "150_200",
        "200_plus"
    ];

    public static array $AVAILABILITY = [
        "full_time",
        "part_time",
        "limited",
        "project_based"
    ];
}
