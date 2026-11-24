<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * Core's maps keyed by attribute or priority, turned into the rows of the document. A value of a shape core does
 * not accept goes through unchanged, for the schema to report.
 */
final class InverseRows
{
    public static function attributes(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        $rows = [];
        foreach ($value as $key => $item) {
            $rows[] = match (true) {
                is_int($key) && is_string($item) => ['name' => $item],
                is_int($key) && !is_array($item) => $item,
                default => ['name' => (string) $key, 'values' => InverseForms::stringList($item)],
            };
        }

        return $rows;
    }


    public static function encodings(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        $rows = [];
        foreach ($value as $name => $encoding) {
            $rows[] = ['name' => (string) $name, 'encoding' => $encoding];
        }

        return $rows;
    }


    public static function authproc(mixed $value): mixed
    {
        if (!is_array($value)) {
            return $value;
        }

        $rows = [];
        foreach ($value as $priority => $filter) {
            $rows[] = ['priority' => $priority, 'filter' => is_string($filter) ? ['class' => $filter] : $filter];
        }

        return $rows;
    }
}
