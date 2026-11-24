<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\DatabaseState;
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
     * The state page to answer with, or null when the schema matches the code.
     */
    public function blockingPage(): ?Template
    {
        $inspector = new StateInspector(new ConnectionFactory(), ModuleConfig::database(), SchemaVersion::LATEST);
        $status = $inspector->inspect();

        return $status->state === DatabaseState::Ready ? null : $this->pages->render($status);
    }
}
