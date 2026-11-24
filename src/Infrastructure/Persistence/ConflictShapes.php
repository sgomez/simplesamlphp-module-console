<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

final class ConflictShapes
{
    /** A lost race, in the shapes the engines give it (section 4.8). */
    public static function isConflict(\PDOException $error): bool
    {
        [$state, $code] = self::info($error);

        return in_array($state, ['40001', '40P01'], true)
            || ($state === 'HY000' && ($code === 1020 || ($code === 5 && self::mentions($error, ['locked', 'busy']))));
    }


    public static function isDuplicateKey(\PDOException $error): bool
    {
        [$state, $code] = self::info($error);

        return $state === '23505'
            || ($state === '23000' && ($code === 1062 || ($code === 19 && self::mentions($error, ['unique']))));
    }


    /**
     * @return array{?string, ?int}
     */
    private static function info(\PDOException $error): array
    {
        $info = $error->errorInfo ?? [];
        $state = $info[0] ?? null;
        $code = $info[1] ?? null;

        return [is_string($state) ? $state : null, is_int($code) ? $code : null];
    }


    /**
     * @param list<string> $words
     */
    private static function mentions(\PDOException $error, array $words): bool
    {
        foreach ($words as $word) {
            if (stripos($error->getMessage(), $word) !== false) {
                return true;
            }
        }

        return false;
    }
}
