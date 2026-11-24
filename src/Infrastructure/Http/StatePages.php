<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Configuration;
use SimpleSAML\Module;
use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Domain\MigrationReport;
use SimpleSAML\Module\console\Domain\SqliteVersion;
use SimpleSAML\XHTML\Template;

final class StatePages
{
    public function __construct(
        private readonly Configuration $config,
        private readonly AdminAccess $access,
        private readonly CsrfToken $token,
        private readonly FlashMessage $flash,
    ) {
    }


    public function render(DatabaseStatus $status, ?MigrationReport $report = null): Template
    {
        $template = new Template($this->config, 'console:state/' . $this->page($status->state) . '.twig');
        $template->data = [
            'identity' => $this->access->identity(),
            'adminUrl' => Module::getModuleURL('admin/'),
            'logoutUrl' => $this->access->logoutUrl(),
            'status' => $status,
            'message' => $this->flash->take(),
            'csrfToken' => $this->token->token(),
            'consoleUrl' => Module::getModuleURL('console/'),
            'migrateUrl' => Module::getModuleURL('console/migrate'),
            'report' => $report?->outcome === MigrationOutcome::Failed ? $report : null,
            'sqliteMinimum' => SqliteVersion::MINIMUM,
        ];

        return $template;
    }


    private function page(DatabaseState $state): string
    {
        return match ($state) {
            DatabaseState::Unreachable => 'unreachable',
            DatabaseState::SqliteTooOld => 'sqlite-too-old',
            DatabaseState::ConsoleOlder => 'console-older',
            DatabaseState::MigrationsPending, DatabaseState::Ready => 'pending-migrations',
        };
    }
}
