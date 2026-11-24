<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

final class SqliteVersion
{
    public const string MINIMUM = '3.24.0';


    public static function isSupported(string $version): bool
    {
        return version_compare($version, self::MINIMUM, '>=');
    }
}
