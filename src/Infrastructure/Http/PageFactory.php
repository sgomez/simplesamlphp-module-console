<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Configuration;
use SimpleSAML\Module;
use SimpleSAML\XHTML\Template;

final class PageFactory
{
    public function __construct(
        private readonly Configuration $config,
        private readonly AdminAccess $access,
        private readonly CsrfToken $token,
        private readonly FlashMessage $flash,
    ) {
    }


    /**
     * @param array<string, mixed> $data
     */
    public function make(string $template, array $data = [], int $status = 200): Template
    {
        $page = new Template($this->config, 'console:' . $template);
        $page->data = $data + [
            'identity' => $this->access->identity(),
            'adminUrl' => Module::getModuleURL('admin/'),
            'logoutUrl' => $this->access->logoutUrl(),
            'message' => $this->flash->take(),
            'notice' => $this->flash->takeNotice(),
            'csrfToken' => $this->token->token(),
            'consoleUrl' => Module::getModuleURL('console/'),
        ];
        $page->setStatusCode($status);

        return $page;
    }


    public function notFound(): Template
    {
        return $this->make('not-found.twig', [], 404);
    }
}
