<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Configuration;
use SimpleSAML\Module;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\XHTML\Template;

final class HomeController
{
    public function __construct(
        private readonly Configuration $config,
        private readonly AdminAccess $access,
    ) {
    }


    public function main(): Template
    {
        $this->access->requireAdmin();

        $template = new Template($this->config, 'console:home.twig');
        $template->data = [
            'identity' => $this->access->identity(),
            'adminUrl' => Module::getModuleURL('admin/'),
            'logoutUrl' => $this->access->logoutUrl(),
        ];

        return $template;
    }
}
