<?php
use PHPUnit\Framework\TestCase;

require_once __DIR__ . "/../../engines/validators.php";

class ValidatorsTest extends TestCase
{
    public function test_required_passes_when_all_fields_present(): void
    {
        $data    = ["name" => "John", "email" => "john@test.com", "role" => "designer"];
        $missing = Validators::required($data, ["name", "email", "role"]);
        $this->assertEmpty($missing);
    }

    public function test_required_catches_missing_field(): void
    {
        $data    = ["name" => "John"];
        $missing = Validators::required($data, ["name", "email"]);
        $this->assertContains("email", $missing);
    }

    public function test_required_catches_empty_string(): void
    {
        $data    = ["name" => "", "email" => "john@test.com"];
        $missing = Validators::required($data, ["name", "email"]);
        $this->assertContains("name", $missing);
    }

    public function test_required_catches_whitespace_only_string(): void
    {
        $data    = ["name" => "   "];
        $missing = Validators::required($data, ["name"]);
        $this->assertContains("name", $missing);
    }

    public function test_required_catches_empty_array_field(): void
    {
        $data    = ["industry_experience" => []];
        $missing = Validators::required($data, ["industry_experience"]);
        $this->assertContains("industry_experience", $missing);
    }

    public function test_required_passes_non_empty_array_field(): void
    {
        $data    = ["industry_experience" => ["tech", "finance"]];
        $missing = Validators::required($data, ["industry_experience"]);
        $this->assertEmpty($missing);
    }

    public function test_required_returns_all_missing_fields(): void
    {
        $data    = [];
        $missing = Validators::required($data, ["name", "email", "role"]);
        $this->assertCount(3, $missing);
        $this->assertContains("name", $missing);
        $this->assertContains("email", $missing);
        $this->assertContains("role", $missing);
    }

    public function test_valid_email_passes(): void
    {
        $this->assertTrue(Validators::isValidEmail("user@radahworks.com"));
    }

    public function test_valid_email_with_subdomain_passes(): void
    {
        $this->assertTrue(Validators::isValidEmail("user@mail.radahworks.com"));
    }

    public function test_empty_email_fails(): void
    {
        $this->assertFalse(Validators::isValidEmail(""));
    }

    public function test_email_without_at_sign_fails(): void
    {
        $this->assertFalse(Validators::isValidEmail("userradahworks.com"));
    }

    public function test_email_without_domain_fails(): void
    {
        $this->assertFalse(Validators::isValidEmail("user@"));
    }

    public function test_email_without_tld_fails(): void
    {
        $this->assertFalse(Validators::isValidEmail("user@domain"));
    }

    public function test_email_with_spaces_fails(): void
    {
        $this->assertFalse(Validators::isValidEmail("user @radahworks.com"));
    }

    public function test_in_enum_returns_true_for_valid_value(): void
    {
        $this->assertTrue(Validators::inEnum("designer", ["designer", "developer", "marketer"]));
    }

    public function test_in_enum_returns_false_for_invalid_value(): void
    {
        $this->assertFalse(Validators::inEnum("accountant", ["designer", "developer", "marketer"]));
    }

    public function test_in_enum_is_case_sensitive(): void
    {
        $this->assertFalse(Validators::inEnum("Designer", ["designer", "developer"]));
    }

    public function test_in_enum_returns_false_for_empty_value(): void
    {
        $this->assertFalse(Validators::inEnum("", ["designer", "developer"]));
    }

    public function test_ensure_array_returns_array_unchanged(): void
    {
        $this->assertSame(["a", "b", "c"], Validators::ensureArray(["a", "b", "c"]));
    }

    public function test_ensure_array_wraps_string_in_array(): void
    {
        $this->assertSame(["designer"], Validators::ensureArray("designer"));
    }

    public function test_ensure_array_converts_null_to_empty_array(): void
    {
        $this->assertSame([], Validators::ensureArray(null));
    }

    public function test_ensure_array_wraps_integer_in_array(): void
    {
        $this->assertSame([42], Validators::ensureArray(42));
    }
}
