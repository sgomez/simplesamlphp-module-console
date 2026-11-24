<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * Opis stops at the first group of keywords that fails in one schema object. Moving the keywords that sit
 * next to a `$ref` into their own `allOf` branch makes every one of them report.
 */
final class SchemaSplitter
{
    public static function split(mixed $node): mixed
    {
        if (!is_array($node)) {
            return $node;
        }
        $node = array_map(self::split(...), $node);

        return !array_is_list($node) && isset($node['$ref']) ? self::separate($node) : $node;
    }


    /**
     * @param array<array-key, mixed> $node
     * @return array<array-key, mixed>
     */
    private static function separate(array $node): array
    {
        $outer = array_filter($node, self::annotation(...), ARRAY_FILTER_USE_KEY);
        $rules = array_diff_key($node, $outer, ['$ref' => true]);

        return $rules === [] ? $node : $outer + ['allOf' => [['$ref' => $node['$ref']], $rules]];
    }


    private static function annotation(int|string $key): bool
    {
        $annotations = ['title', 'description', 'examples', 'default', '$comment', '$schema'];

        return in_array($key, $annotations, true) || str_starts_with((string) $key, 'x-');
    }
}
