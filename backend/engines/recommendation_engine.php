<?php

require_once __DIR__ . "/nlp_extractor.php";

class RecommendationEngine
{
    public static function generate(array $project): array
    {
        $description = $project["description"] ?? "";
        $signals = NLPExtractor::extractAllSignals($description);

        $insights = [];
        $actions = [];
        $roles = [];

        /* -----------------------------
         * 1. PROJECT STAGE LOGIC
         * ----------------------------- */
        switch ($project["project_stage"] ?? "idea") {
            case "idea":
                $actions[] = "User discovery interviews";
                $actions[] = "Problem validation";
                $roles[] = "product_manager";
                $insights[] = "Project is at idea stage";
                break;

            case "mvp":
                $actions[] = "Define MVP scope";
                $actions[] = "Rapid feature prototyping";
                $roles[] = "software_engineer";
                $roles[] = "ui_ux_designer";
                $insights[] = "MVP-stage execution detected";
                break;

            case "launch":
                $actions[] = "Stability and QA testing";
                $actions[] = "Deployment readiness";
                $roles[] = "software_engineer";
                $roles[] = "qa_engineer";
                $insights[] = "Launch-stage signals detected";
                break;

            case "growth":
                $actions[] = "Performance optimization";
                $actions[] = "Analytics and growth experiments";
                $roles[] = "data_analyst";
                $roles[] = "growth_marketer";
                $insights[] = "Growth-stage focus identified";
                break;
        }

        /* -----------------------------
         * 2. NLP-BASED INSIGHTS
         * ----------------------------- */
        if (empty($signals["capabilities"] ?? [])) {
            $insights[] = "Technical requirements are not clearly defined";
            $actions[] = "Clarify technical scope";
            $roles[] = "technical_consultant";
        }

        if (count($signals["capabilities"] ?? []) >= 3) {
            $insights[] = "Complex feature set detected";
            $roles[] = "software_architect";
        }

        if (!empty($signals["industries"])) {
            $insights[] = "Industry-specific language detected";
        }

        /* -----------------------------
         * 3. TIMELINE HEURISTICS
         * ----------------------------- */
        if (($project["timeline"] ?? "") === "asap") {
            $actions[] = "Lean execution with minimal handoffs";
            $roles[] = "project_manager";
            $insights[] = "Urgent timeline detected";
        }

        /* -----------------------------
         * 4. BUDGET HEURISTICS
         * ----------------------------- */
        if (in_array($project["budget_range"] ?? "", ["under_5000", "5000_10000"], true)) {
            $insights[] = "Budget favors lean team composition";
            $actions[] = "Focus on highest-impact features only";
        }

        /* -----------------------------
         * 5. ROLE NORMALIZATION
         * ----------------------------- */
        $roles = array_values(array_unique($roles));

        // Always ensure a core execution role exists
        if (!in_array("software_engineer", $roles, true)) {
            $roles[] = "software_engineer";
        }

        /* -----------------------------
         * 6. FINAL FOCUS MESSAGE
         * ----------------------------- */
        $focus = self::deriveFocusMessage($project, $signals);

        return [
            "focus" => $focus,
            "recommended_actions" => array_values(array_unique($actions)),
            "suggested_roles" => $roles,
            "insights" => $insights
        ];
    }

    private static function deriveFocusMessage(array $project, array $signals): string
    {
        if (($project["project_stage"] ?? "") === "idea") {
            return "Focus on validating the problem and user workflow before committing to build.";
        }

        if (($project["project_stage"] ?? "") === "mvp") {
            return "Focus on delivering a functional core product with minimal features.";
        }

        if (($project["project_stage"] ?? "") === "growth") {
            return "Focus on scaling, analytics, and system robustness.";
        }

        return "Focus on structured execution aligned with your project goals.";
    }
}