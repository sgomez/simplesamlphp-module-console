<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * The rows of the document that core takes as maps.
 */
final class TranslatedRows
{
    /**
     * A row without values becomes a positional name, a row with them `name => values`.
     *
     * @param array<array-key, mixed> $rows
     * @return array<array-key, mixed>
     */
    public static function attributes(array $rows): array
    {
        $policy = [];
        foreach ($rows as $row) {
            $row = (array) $row;
            $name = self::name($row);
            isset($row['values']) ? $policy[$name] = $row['values'] : $policy[] = $name;
        }

        return $policy;
    }


    /**
     * @param array<array-key, mixed> $rows
     * @return array<string, mixed>
     */
    public static function encodings(array $rows): array
    {
        $encodings = [];
        foreach ($rows as $row) {
            $row = (array) $row;
            $encodings[self::name($row)] = $row['encoding'] ?? null;
        }

        return $encodings;
    }


    /**
     * @param array<array-key, mixed> $rows
     * @return array<int, mixed>
     */
    public static function authproc(array $rows): array
    {
        $filters = [];
        foreach ($rows as $row) {
            $row = (array) $row;
            $priority = $row['priority'] ?? 0;
            $filters[is_int($priority) ? $priority : 0] = $row['filter'] ?? [];
        }

        return $filters;
    }


    /**
     * @param array<array-key, mixed> $row
     */
    private static function name(array $row): string
    {
        $name = $row['name'] ?? '';

        return is_string($name) ? $name : '';
    }
}
