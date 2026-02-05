<?php

require __DIR__ . '/bootstrap.php';

class Validators
{
    public static function required(array $data, array $fields): array
{
    $missing = [];

    foreach ($fields as $f) {
        if (!isset($data[$f])) {
            $missing[] = $f;
            continue;
        }

        $value = $data[$f];

        // If the required field is an array (e.g. industry_experience)
        if (is_array($value)) {
            if (count($value) === 0) {
                $missing[] = $f;
            }
            continue;
        }

        // If the required field is a string/number
        if (trim((string)$value) === "") {
            $missing[] = $f;
        }
    }

    return $missing;
}

    public static function isValidEmail(string $email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public static function inEnum(string $value, array $allowed): bool
    {
        return in_array($value, $allowed, true);
    }

    public static function ensureArray($value): array
    {
        if (is_array($value)) return $value;
        if ($value === null) return [];
        return [$value];
    }
}
