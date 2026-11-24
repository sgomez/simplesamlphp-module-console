<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Domain\MigrationReport;
use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;

final class Migrator
{
    public function __construct(
        private readonly ConnectionFactory $connections,
        private readonly DatabaseSettings $settings,
    ) {
    }


    public function run(string $identity): MigrationReport
    {
        try {
            $pdo = $this->connections->open($this->settings);
        } catch (\PDOException $e) {
            return new MigrationReport(MigrationOutcome::Failed, [], null, $e->getMessage());
        }

        return (new MigrationRunner($pdo, $this->settings->prefix))->run($identity);
    }
}
