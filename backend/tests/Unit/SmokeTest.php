<?php

use PHPUnit\Framework\TestCase;

class SmokeTest extends TestCase
{
    public function test_phpunit_is_working(): void
    {
        $this->assertTrue(true);
    }

    public function test_php_version_is_84(): void
    {
        $this->assertGreaterThanOrEqual(
            '8.4.0',
            PHP_VERSION,
            'PHP 8.4+ is required'
        );
    }
}
