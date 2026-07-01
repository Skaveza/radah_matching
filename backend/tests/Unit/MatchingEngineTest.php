<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . "/../../engines/tfidf.php";
require_once __DIR__ . "/../../engines/nlp_extractor.php";
require_once __DIR__ . "/../../engines/matching_engine.php";

class MatchingEngineTest extends TestCase
{
    private function makeProfessional(array $overrides = []): array
    {
        return array_merge([
            "id"                   => uniqid("pro_"),
            "primary_role"         => "developer",
            "professional_summary" => "Experienced web developer skilled in PHP and APIs",
            "hourly_rate_range"    => "50-80",
            "years_experience"     => "3_5",
            "availability"         => "full_time",
            "industry_experience"  => ["tech"],
            "region"               => "nairobi",
        ], $overrides);
    }

    private function makeProject(array $overrides = []): array
    {
        return array_merge([
            "description"  => "We need a PHP developer to build REST APIs for our platform",
            "budget_range" => "under_5000",
            "industry"     => "tech",
            "region"       => "nairobi",
        ], $overrides);
    }

    public function test_budget_constants_are_defined(): void
    {
        $budgets = MatchingEngine::$BUDGET_TO_MAX_HOURLY;
        $this->assertArrayHasKey("under_5000", $budgets);
        $this->assertArrayHasKey("5000_10000", $budgets);
        $this->assertArrayHasKey("10000_25000", $budgets);
        $this->assertArrayHasKey("25000_50000", $budgets);
        $this->assertArrayHasKey("50000_plus", $budgets);
    }

    public function test_budget_max_values_are_ascending(): void
    {
        $values = array_values(MatchingEngine::$BUDGET_TO_MAX_HOURLY);
        for ($i = 1; $i < count($values); $i++) {
            $this->assertGreaterThan($values[$i - 1], $values[$i]);
        }
    }

    public function test_generate_team_returns_correct_keys(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(),
            [$this->makeProfessional()]
        );
        $this->assertArrayHasKey("project_signals", $result);
        $this->assertArrayHasKey("team", $result);
    }

    public function test_generate_team_respects_team_size(): void
    {
        $professionals = [
            $this->makeProfessional(["primary_role" => "developer"]),
            $this->makeProfessional(["primary_role" => "designer"]),
            $this->makeProfessional(["primary_role" => "marketer"]),
            $this->makeProfessional(["primary_role" => "manager"]),
            $this->makeProfessional(["primary_role" => "analyst"]),
        ];
        $result = MatchingEngine::generateTeam($this->makeProject(), $professionals, 3);
        $this->assertCount(3, $result["team"]);
    }

    public function test_empty_professionals_returns_empty_team(): void
    {
        $result = MatchingEngine::generateTeam($this->makeProject(), []);
        $this->assertEmpty($result["team"]);
    }

    public function test_missing_description_does_not_crash(): void
    {
        $result = MatchingEngine::generateTeam(
            ["budget_range" => "under_5000", "industry" => "tech"],
            [$this->makeProfessional()]
        );
        $this->assertArrayHasKey("team", $result);
    }

    public function test_professional_over_budget_is_excluded(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(["budget_range" => "under_5000"]),
            [
                $this->makeProfessional(["id" => "affordable", "hourly_rate_range" => "50-70"]),
                $this->makeProfessional(["id" => "expensive",  "hourly_rate_range" => "100-150", "primary_role" => "designer"]),
            ]
        );
        $ids = array_column(array_column($result["team"], "professional"), "id");
        $this->assertContains("affordable", $ids);
        $this->assertNotContains("expensive", $ids);
    }

    public function test_team_has_diverse_roles(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(),
            [
                $this->makeProfessional(["id" => "dev1", "primary_role" => "developer"]),
                $this->makeProfessional(["id" => "dev2", "primary_role" => "developer"]),
                $this->makeProfessional(["id" => "des1", "primary_role" => "designer"]),
                $this->makeProfessional(["id" => "mkt1", "primary_role" => "marketer"]),
            ],
            3
        );
        $roles = array_column(array_column($result["team"], "professional"), "primary_role");
        $this->assertCount(count($roles), array_unique($roles), "Team should have diverse roles");
    }

    public function test_each_member_has_score_and_debug(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(),
            [
                $this->makeProfessional(["primary_role" => "developer"]),
                $this->makeProfessional(["primary_role" => "designer"]),
            ]
        );
        foreach ($result["team"] as $member) {
            $this->assertArrayHasKey("score", $member);
            $this->assertArrayHasKey("debug", $member);
            $this->assertArrayHasKey("professional", $member);
            $this->assertIsFloat($member["score"]);
        }
    }

    public function test_debug_contains_all_score_components(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(),
            [$this->makeProfessional()]
        );
        if (empty($result["team"])) {
            $this->markTestSkipped("No team returned");
        }
        $debug = $result["team"][0]["debug"];
        $this->assertArrayHasKey("cap_score", $debug);
        $this->assertArrayHasKey("industry_score", $debug);
        $this->assertArrayHasKey("tfidf_score", $debug);
        $this->assertArrayHasKey("experience_score", $debug);
        $this->assertArrayHasKey("availability_score", $debug);
        $this->assertArrayHasKey("region_score", $debug);
    }

    public function test_same_region_gets_region_score_boost(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(["region" => "nairobi"]),
            [
                $this->makeProfessional(["id" => "local",  "region" => "nairobi"]),
                $this->makeProfessional(["id" => "remote", "region" => "lagos", "primary_role" => "designer"]),
            ],
            2
        );
        $local = array_values(array_filter(
            $result["team"],
            fn($m) => $m["professional"]["id"] === "local"
        ));
        if (empty($local)) {
            $this->markTestSkipped("Local professional not in team");
        }
        $this->assertEquals(5, $local[0]["debug"]["region_score"]);
    }

    public function test_different_region_gets_no_region_score(): void
    {
        $result = MatchingEngine::generateTeam(
            $this->makeProject(["region" => "nairobi"]),
            [$this->makeProfessional(["id" => "remote", "region" => "lagos"])]
        );
        if (empty($result["team"])) {
            $this->markTestSkipped("No team returned");
        }
        $this->assertEquals(0, $result["team"][0]["debug"]["region_score"]);
    }
}
