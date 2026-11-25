<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\SchemaVersion;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;
use SimpleSAML\Module\console\Infrastructure\Persistence\DatabaseReading;
use SimpleSAML\Module\console\Infrastructure\Persistence\StateInspector;

final class DatabaseGate
{
    public function reading(): DatabaseReading
    {
        $inspector = new StateInspector(new ConnectionFactory(), ModuleConfig::database(), SchemaVersion::LATEST);

        return $inspector->read();
    }
}
