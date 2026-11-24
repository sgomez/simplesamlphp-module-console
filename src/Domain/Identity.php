<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

final class Identity
{
    public const string CONSTANT = 'admin';


    /**
     * @param array<array-key, mixed> $attributes
     */
    public static function resolve(?string $attributeName, array $attributes): string
    {
        if ($attributeName === null) {
            return self::CONSTANT;
        }

        $values = $attributes[$attributeName] ?? null;
        $first = is_array($values) ? ($values[array_key_first($values)] ?? null) : null;

        return is_string($first) && $first !== '' ? $first : self::CONSTANT;
    }
}
