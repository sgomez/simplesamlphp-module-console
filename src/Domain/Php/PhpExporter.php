<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

final class PhpExporter
{
    private const string INDENT = '    ';


    /**
     * @param array<array-key, mixed> $options
     */
    public static function statement(string $entityId, array $options): string
    {
        return '$metadata[' . self::string($entityId) . '] = ' . self::value($options) . ';';
    }


    public static function value(mixed $value, int $depth = 0): string
    {
        return match (true) {
            is_array($value) => self::array($value, $depth),
            is_string($value) => self::string($value),
            is_bool($value) => $value ? 'true' : 'false',
            $value === null => 'null',
            is_int($value) => (string) $value,
            is_float($value) => json_encode($value, JSON_PRESERVE_ZERO_FRACTION | JSON_THROW_ON_ERROR),
            default => throw new \InvalidArgumentException('Only scalars and arrays can be written as PHP'),
        };
    }


    /**
     * @param array<array-key, mixed> $value
     */
    private static function array(array $value, int $depth): string
    {
        if ($value === []) {
            return '[]';
        }

        $pad = str_repeat(self::INDENT, $depth + 1);
        $next = 0;
        $lines = [];
        foreach ($value as $key => $item) {
            $prefix = $key === $next ? '' : self::value($key) . ' => ';
            $next = is_int($key) ? max($next, $key + 1) : $next;
            $lines[] = $pad . $prefix . self::value($item, $depth + 1) . ',';
        }

        return "[\n" . implode("\n", $lines) . "\n" . str_repeat(self::INDENT, $depth) . ']';
    }


    private static function string(string $value): string
    {
        return "'" . str_replace(['\\', "'"], ['\\\\', "\\'"], $value) . "'";
    }
}
