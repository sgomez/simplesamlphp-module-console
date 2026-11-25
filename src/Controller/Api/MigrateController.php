<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;
use SimpleSAML\Module\console\Infrastructure\Persistence\MigrationCatalog;
use SimpleSAML\Module\console\Infrastructure\Persistence\Migrator;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class MigrateController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly AdminAccess $access,
    ) {
    }


    public function run(Request $request): JsonResponse
    {
        $stopped = $this->gate->guard($request, migrating: true);
        if ($stopped !== null) {
            return $stopped;
        }
        $report = (new Migrator(new ConnectionFactory(), ModuleConfig::database()))->run($this->access->identity());
        $failed = $report->outcome === MigrationOutcome::Failed ? $report->failedAt : null;

        return new JsonResponse([
            'outcome' => $report->outcome->name,
            'applied' => $report->applied,
            'failed' => $failed === null ? null : ['number' => $failed, 'title' => MigrationCatalog::title($failed)],
            'reason' => $report->reason,
        ]);
    }
}
