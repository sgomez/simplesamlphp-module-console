<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Build;

/**
 * Names on disk under the Snapshot directory (section 3.5).
 */
final class BuildLayout
{
    public const string CURRENT = 'current';

    public const string MANIFEST = 'manifest.json';

    public const string AUTHSOURCES = 'authsources.php';

    public const string WORK_PREFIX = '.building-';


    public static function setFile(string $set): string
    {
        return $set . '.php';
    }


    public static function isBuildName(string $name): bool
    {
        return preg_match('/^[1-9][0-9]*-[1-9][0-9]*$/', $name) === 1;
    }
}
