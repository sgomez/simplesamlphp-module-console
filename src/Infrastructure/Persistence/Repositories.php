<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Application\EntityRepository;
use SimpleSAML\Module\console\Application\Publication\NoEntityWarnings;
use SimpleSAML\Module\console\Application\Publication\Publication;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Infrastructure\Core\CoreProcessingFilterClasses;

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


    public function publication(): Publication
    {
        $settings = ModuleConfig::database();
        $store = new PdoPublicationStore((new ConnectionFactory())->open($settings), $settings->prefix);

        return new Publication(
            $store,
            new SpRemote(new CoreCertificateFiles()),
            new CoreProcessingFilterClasses(),
            new NoEntityWarnings(),
        );
    }
}
