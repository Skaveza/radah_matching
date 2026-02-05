<?php
require __DIR__ . '/bootstrap.php';
require_once __DIR__ . "/nlp_extractor.php";
require_once __DIR__ . "/tfidf.php";

class MatchingEngine
{
    public static array $BUDGET_TO_MAX_HOURLY = [
        "under_5000" => 75,
        "5000_10000" => 100,
        "10000_25000" => 150,
        "25000_50000" => 200,
        "50000_plus" => 9999
    ];

    public static function generateTeam(array $project, array $professionals, int $teamSize = 4): array
    {
        $projectDesc = $project["description"] ?? "";
        $budgetRange = $project["budget_range"] ?? "under_5000";

        $projectSignals = NLPExtractor::extractAllSignals($projectDesc);

        // TF-IDF prep
        $docsTokens = [];
        $proTokens = [];

        foreach ($professionals as $p) {
            $tokens = TFIDF::tokenize($p["professional_summary"] ?? "");
            $docsTokens[] = $tokens;
            $proTokens[$p["id"]] = $tokens;
        }

        $projectTokens = TFIDF::tokenize($projectDesc);
        $docsTokens[] = $projectTokens;

        $idf = TFIDF::buildIDF($docsTokens);
        $projectVec = TFIDF::vectorize($projectTokens, $idf);

        // Score professionals
        $scored = [];
        foreach ($professionals as $p) {
            if (!self::passesBudget($p, $budgetRange)) continue;

            $scored[] = self::scoreProfessional(
                $p,
                $project,
                $projectSignals,
                $projectVec,
                $idf,
                $proTokens[$p["id"]] ?? []
            );
        }

        usort($scored, fn($a, $b) => $b["score"] <=> $a["score"]);

        // Team selection: role diversity first
        $team = [];
        $usedRoles = [];

        foreach ($scored as $candidate) {
            if (count($team) >= $teamSize) break;

            $role = $candidate["professional"]["primary_role"] ?? "unknown";
            if (in_array($role, $usedRoles, true)) continue;

            $team[] = $candidate;
            $usedRoles[] = $role;
        }

        // Fill remaining slots if needed
        if (count($team) < $teamSize) {
            foreach ($scored as $candidate) {
                if (count($team) >= $teamSize) break;

                $alreadyIn = false;
                foreach ($team as $t) {
                    if ($t["professional"]["id"] === $candidate["professional"]["id"]) {
                        $alreadyIn = true;
                        break;
                    }
                }
                if ($alreadyIn) continue;

                $team[] = $candidate;
            }
        }

        return [
            "project_signals" => $projectSignals,
            "team" => $team
        ];
    }

    private static function passesBudget(array $professional, string $budgetRange): bool
    {
        $maxAllowed = self::$BUDGET_TO_MAX_HOURLY[$budgetRange] ?? 75;
        $rateRange = $professional["hourly_rate_range"] ?? "";
        [$min, $max] = self::parseRateRange($rateRange);

        return $min <= $maxAllowed;
    }

    private static function parseRateRange(string $range): array
    {
        $range = trim($range);

        if ($range === "") return [0, 9999];

        if (str_contains($range, "+")) {
            $min = (int) str_replace("+", "", $range);
            return [$min, 9999];
        }

        if (str_contains($range, "-")) {
            [$a, $b] = explode("-", $range);
            return [(int)trim($a), (int)trim($b)];
        }

        return [(int)$range, (int)$range];
    }

    private static function scoreProfessional(
        array $professional,
        array $project,
        array $projectSignals,
        array $projectVec,
        array $idf,
        array $professionalTokens
    ): array
    {
        $summary = $professional["professional_summary"] ?? "";
        $proSignals = NLPExtractor::extractAllSignals($summary);

        // 1) Capability overlap (main)
        $projectCaps = $projectSignals["capabilities"] ?? [];
        $proCaps = $proSignals["capabilities"] ?? [];

        $capOverlap = array_values(array_intersect($projectCaps, $proCaps));
        $capOverlapCount = count($capOverlap);

        // Scoring rule
        if ($capOverlapCount >= 2) $capScore = 40;
        elseif ($capOverlapCount === 1) $capScore = 28;
        else $capScore = 8;

        // 2) Industry overlap
        $industryScore = 0;
        $projectIndustry = $project["industry"] ?? null;
        $proIndustryList = $professional["industry_experience"] ?? [];

        if ($projectIndustry && in_array($projectIndustry, $proIndustryList, true)) {
            $industryScore = 12;
        } else {
            $projInd = $projectSignals["industries"] ?? [];
            $proInd = $proSignals["industries"] ?? [];
            $industryScore = count(array_intersect($projInd, $proInd)) > 0 ? 8 : 0;
        }

        // 3) TF-IDF similarity
        $proVec = TFIDF::vectorize($professionalTokens, $idf);
        $similarity = TFIDF::cosineSimilarity($projectVec, $proVec);
        $tfidfScore = min(25, $similarity * 25);

        // 4) Experience boost
        $exp = $professional["years_experience"] ?? "1_3";
        $expScore = match ($exp) {
            "10_plus" => 10,
            "7_10" => 8,
            "5_7" => 6,
            "3_5" => 4,
            default => 2
        };

        // 5) Availability boost
        $availability = $professional["availability"] ?? "project_based";
        $availabilityScore = match ($availability) {
            "full_time" => 6,
            "part_time" => 4,
            "limited" => 2,
            default => 1
        };

        $total = $capScore + $industryScore + $tfidfScore + $expScore + $availabilityScore;

        return [
            "professional" => $professional,
            "score" => round($total, 2),
            "debug" => [
                "cap_overlap" => $capOverlap,
                "cap_score" => $capScore,
                "industry_score" => $industryScore,
                "tfidf_similarity" => round($similarity, 4),
                "tfidf_score" => round($tfidfScore, 2),
                "experience_score" => $expScore,
                "availability_score" => $availabilityScore,
                "project_signals" => $projectSignals,
                "professional_signals" => $proSignals,
            ]
        ];
    }
}
