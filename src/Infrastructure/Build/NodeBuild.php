<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Build;

use SimpleSAML\Logger;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;

/**
 * The build of a Snapshot by the node that served its Publication, within that request (section 3.5).
 */
final class NodeBuild
{
    public function __construct(private readonly Repositories $repositories)
    {
    }


    /**
     * A failure never undoes the Publication: it is logged and returned as text for the administrator.
     *
     * @return string empty when the build succeeded
     */
    public function after(int $number): string
    {
        try {
            $snapshot = $this->repositories->snapshot($number)
                ?? throw new BuildFailed('Snapshot ' . $number . ' cannot be read');
            (new LocalBuilder(ModuleConfig::snapshotDir(), ModuleConfig::version()))->build($snapshot);

            return '';
        } catch (\Throwable $e) {
            Logger::error('console: the local build of Snapshot ' . $number . ' failed: ' . $e->getMessage());

            return ' This node could not build it: ' . $e->getMessage()
                . ' It keeps serving its previous build; publish again once this is fixed.';
        }
    }
}
