<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Configuration;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Infrastructure\Http\FrontendAssets;
use SimpleSAML\XHTML\Template;
use Symfony\Component\HttpFoundation\Response;

final class ShellController
{
    public function __construct(
        private readonly Configuration $config,
        private readonly AdminAccess $access,
        private readonly CsrfToken $token,
        private readonly FrontendAssets $assets,
    ) {
    }


    /**
     * The page shell, in every database state: the interface learns the state from the API and shows its page.
     */
    public function show(): Response
    {
        $this->access->requireAdmin();
        $shell = new Template($this->config, 'console:app.twig');
        $shell->data = ['token' => $this->token->token()] + $this->assets->references();

        return $shell;
    }
}
