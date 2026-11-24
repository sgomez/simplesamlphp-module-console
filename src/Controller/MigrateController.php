<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Domain\MigrationReport;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\DatabaseGate;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\Module\console\Infrastructure\Http\StatePages;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;
use SimpleSAML\Module\console\Infrastructure\Persistence\Migrator;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class MigrateController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly AdminAccess $access,
        private readonly DatabaseGate $database,
        private readonly StatePages $pages,
        private readonly FlashMessage $flash,
    ) {
    }


    public function run(Request $request): Response
    {
        $stopped = $this->gate->guardPost($request, migrating: true);
        if ($stopped !== null) {
            return $stopped;
        }

        $migrator = new Migrator(new ConnectionFactory(), ModuleConfig::database());
        $report = $migrator->run($this->access->identity());
        if ($report->outcome === MigrationOutcome::Failed) {
            return $this->pages->render($this->database->status(), $report);
        }
        $this->flash->put($this->message($report));

        return new RedirectResponse(Module::getModuleURL('console/'));
    }


    private function message(MigrationReport $report): string
    {
        if ($report->outcome === MigrationOutcome::Concurrent) {
            return (string) $report->reason;
        }

        return $report->applied === []
            ? 'The database schema is already up to date.'
            : 'Migrations applied: ' . implode(', ', $report->applied) . '.';
    }
}
