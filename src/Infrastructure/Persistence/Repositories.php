<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Application\EntityRepository;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;

/**
 * Opens the connection on demand, so that a controller can be built before the database state is checked.
 */
final class Repositories
{
    public function entities(): EntityRepository
    {
        $settings = ModuleConfig::database();

        return new PdoEntityRepository((new ConnectionFactory())->open($settings), $settings->prefix);
    }
}
