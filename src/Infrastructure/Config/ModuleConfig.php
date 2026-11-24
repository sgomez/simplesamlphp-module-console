<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Config;

use SimpleSAML\Configuration;

final class ModuleConfig
{
    private const string FILE = 'module_console.php';


    public static function userIdAttribute(): ?string
    {
        return Configuration::getOptionalConfig(self::FILE)->getOptionalString('useridattr', null);
    }
}
