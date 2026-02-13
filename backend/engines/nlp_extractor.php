<?php

require_once __DIR__ . '/../bootstrap.php';

class NLPExtractor
{
    public static array $CAPABILITIES = [
        "machine_learning" => ["machine learning", "ml", "predictive", "forecasting", "modeling"],
        "data_analysis" => ["data analysis", "data analytics", "analytics", "eda", "insights", "dashboards"],
        "cybersecurity" => ["cybersecurity", "cyber security", "security", "secure", "penetration", "pentesting"],
        "web_development" => ["web development", "web app", "website", "frontend", "backend", "full stack", "fullstack"],
        "mobile_development" => ["mobile app", "android", "ios", "flutter", "react native"],
        "uiux" => ["ui", "ux", "ui/ux", "figma", "wireframe", "prototype", "user experience", "user interface"],
        "product_management" => ["product manager", "product management", "roadmap", "requirements", "user stories"],
        "qa_testing" => ["qa", "testing", "test cases", "automation testing", "quality assurance"],
        "devops_cloud" => ["devops", "deployment", "docker", "kubernetes", "ci/cd", "cloud", "aws", "gcp", "azure"],
        "marketing" => ["marketing", "growth", "seo", "ads", "campaigns", "brand", "go to market", "go-to-market"],
        "content" => ["content", "copywriting", "writing", "blog", "social media", "content strategy"],
        "database" => ["database", "sql", "postgres", "postgresql", "sqlite", "mysql", "firebase"],
        "api_backend" => ["api", "rest api", "backend", "server", "php", "node", "django", "flask"],
    ];

    public static array $ROLES = [
        "technical_lead" => ["technical lead", "tech lead", "engineering lead"],
        "fullstack_developer" => ["fullstack", "full stack developer", "full-stack developer"],
        "frontend_developer" => ["frontend developer", "front-end developer", "frontend engineer"],
        "backend_developer" => ["backend developer", "back-end developer", "backend engineer"],
        "uiux_designer" => ["uiux designer", "ui/ux designer", "product designer", "ux designer", "ui designer"],
        "product_manager" => ["product manager", "pm", "product management"],
        "devops_engineer" => ["devops engineer", "site reliability", "sre", "cloud engineer"],
        "qa_engineer" => ["qa engineer", "quality assurance", "test engineer"],
        "marketing_strategist" => ["marketing strategist", "growth marketer", "digital marketer"],
        "content_writer" => ["content writer", "copywriter", "writer"],
        "data_analyst" => ["data analyst", "business intelligence", "bi analyst"],
    ];

    public static array $INDUSTRIES = [
        "fintech" => ["fintech", "banking", "lending", "wallet"],
        "healthcare" => ["healthcare", "health", "clinic", "hospital", "medical"],
        "education" => ["education", "edtech", "learning", "students", "school"],
        "ecommerce" => ["ecommerce", "e-commerce", "online store", "shop", "store"],
        "real_estate" => ["real estate", "property", "housing"],
        "software" => ["software", "saas", "platform", "b2b", "b2c"],
        "media_entertainment" => ["media", "entertainment", "streaming", "content platform"],
        "food_beverage" => ["food", "restaurant", "beverage", "delivery"],
        "hr_recruitment" => ["hr", "recruitment", "hiring", "talent"],
        "legal" => ["legal", "law", "compliance", "contracts"],
        "logistics_supply_chain" => ["logistics", "supply chain", "delivery", "fleet"],
        "travel_hospitality" => ["travel", "hospitality", "booking", "hotel"],
        "marketing_advertising" => ["marketing", "advertising", "ads"],
        "agriculture" => ["agriculture", "farming", "farmers", "soil", "irrigation", "satellite", "nasa", "climate"],
        "other" => ["other"],
    ];

    public static function extractAllSignals(string $text): array
    {
        return [
            "capabilities" => self::extractFromMap($text, self::$CAPABILITIES),
            "roles" => self::extractFromMap($text, self::$ROLES),
            "industries" => self::extractFromMap($text, self::$INDUSTRIES),
        ];
    }

    public static function extractFromMap(string $text, array $map): array
    {
        $text = self::normalize($text);
        $found = [];

        foreach ($map as $tag => $aliases) {
            foreach ($aliases as $alias) {
                $aliasNorm = self::normalize($alias);
                if ($aliasNorm !== "" && str_contains($text, $aliasNorm)) {
                    $found[] = $tag;
                    break;
                }
            }
        }

        return array_values(array_unique($found));
    }

    public static function normalize(string $text): string
    {
        $text = strtolower($text);
        $text = preg_replace("/[^a-z0-9\s]/", " ", $text);
        $text = preg_replace("/\s+/", " ", $text);
        return trim($text);
    }
}
