<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Configuration;
use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;
use SimpleSAML\Module\console\Infrastructure\Persistence\StateInspector;

final class Helpers
{
    public static function sqliteFile(): string
    {
        return sys_get_temp_dir() . '/console-state-' . bin2hex(random_bytes(6)) . '.sqlite';
    }


    public static function inspect(DatabaseSettings $settings, int $known = 9): DatabaseState
    {
        return (new StateInspector(new ConnectionFactory(), $settings, $known))->read()->status->state;
    }


    /**
     * @param array<string, mixed> $core
     * @param array<string, mixed>|null $module
     */
    public static function configure(array $core, ?array $module = null): void
    {
        Configuration::clearInternalState();
        Configuration::setPreLoadedConfig(Configuration::loadFromArray($core), 'config.php');
        Configuration::setPreLoadedConfig(Configuration::loadFromArray($module ?? []), 'module_console.php');
    }
}
