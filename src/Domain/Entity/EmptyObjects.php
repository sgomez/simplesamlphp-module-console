<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

use Opis\JsonSchema\Errors\ValidationError as OpisError;

/**
 * PHP cannot tell [] from {}: an empty array the schema wants as an object is the empty object.
 */
final class EmptyObjects
{
    /**
     * The path of the first empty array the error says should be an object.
     *
     * @return array<string|int>|null
     */
    public static function path(OpisError $error, mixed $data): ?array
    {
        $path = $error->data()->fullPath();
        if (
            $error->keyword() === 'type'
            && in_array('object', (array) ($error->args()['expected'] ?? []), true)
            && self::at($data, $path) === []
        ) {
            return $path;
        }
        /** @var list<\Opis\JsonSchema\Errors\ValidationError> $subs */
        $subs = $error->subErrors();
        foreach ($subs as $sub) {
            $found = self::path($sub, $data);
            if ($found !== null) {
                return $found;
            }
        }

        return null;
    }


    /**
     * @param array<string|int> $path
     */
    public static function set(mixed $data, array $path): mixed
    {
        if ($path === []) {
            return new \stdClass();
        }
        $key = array_shift($path);
        if (is_object($data)) {
            $data->{$key} = self::set($data->{$key}, $path);
        } elseif (is_array($data)) {
            $data[$key] = self::set($data[$key], $path);
        }

        return $data;
    }


    /**
     * @param array<string|int> $path
     */
    private static function at(mixed $data, array $path): mixed
    {
        foreach ($path as $key) {
            $data = match (true) {
                is_object($data) => $data->{$key} ?? null,
                is_array($data) => $data[$key] ?? null,
                default => null,
            };
        }

        return $data;
    }
}
