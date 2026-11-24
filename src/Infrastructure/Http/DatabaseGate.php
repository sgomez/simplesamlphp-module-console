<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Domain\SchemaVersion;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;
use SimpleSAML\Module\console\Infrastructure\Persistence\StateInspector;
use SimpleSAML\XHTML\Template;

final class DatabaseGate
{
    public function __construct(private readonly StatePages $pages)
    {
    }


    /**
     * The state page to answer with, or null when the request may go on: the schema matches the code or,
     * for the migration run, migrations are pending.
     */
    public function blockingPage(bool $migrating = false): ?Template
    {
        $status = $this->status();
        $open = $status->state === DatabaseState::Ready
            || ($migrating && $status->state === DatabaseState::MigrationsPending);

        return $open ? null : $this->pages->render($status);
    }


    public function status(): DatabaseStatus
    {
        $inspector = new StateInspector(new ConnectionFactory(), ModuleConfig::database(), SchemaVersion::LATEST);

        return $inspector->inspect();
    }
}
