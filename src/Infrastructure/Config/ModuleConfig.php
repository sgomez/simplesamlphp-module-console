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


    public static function database(): DatabaseSettings
    {
        $module = Configuration::getOptionalConfig(self::FILE)->getOptionalConfigItem('database', null);
        if ($module !== null) {
            return new DatabaseSettings(
                $module->getString('dsn'),
                $module->getOptionalString('username', null),
                $module->getOptionalString('password', null),
                $module->getOptionalString('prefix', ''),
            );
        }

        $core = Configuration::getInstance();

        return new DatabaseSettings(
            $core->getOptionalString('database.dsn', 'mysql:host=localhost;dbname=simplesaml'),
            $core->getOptionalString('database.username', null),
            $core->getOptionalString('database.password', null),
            $core->getOptionalString('database.prefix', ''),
        );
    }
}
