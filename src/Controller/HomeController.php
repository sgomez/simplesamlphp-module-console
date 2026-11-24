<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Configuration;
use SimpleSAML\Module;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\DatabaseGate;
use SimpleSAML\XHTML\Template;

final class HomeController
{
    public function __construct(
        private readonly Configuration $config,
        private readonly AdminAccess $access,
        private readonly DatabaseGate $gate,
    ) {
    }


    public function main(): Template
    {
        $this->access->requireAdmin();
        $statePage = $this->gate->blockingPage();
        if ($statePage !== null) {
            return $statePage;
        }

        $template = new Template($this->config, 'console:home.twig');
        $template->data = [
            'identity' => $this->access->identity(),
            'adminUrl' => Module::getModuleURL('admin/'),
            'logoutUrl' => $this->access->logoutUrl(),
        ];

        return $template;
    }
}
