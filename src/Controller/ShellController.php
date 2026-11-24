<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Configuration;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\FrontendAssets;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\XHTML\Template;
use Symfony\Component\HttpFoundation\Response;

final class ShellController
{
    public function __construct(
        private readonly Configuration $config,
        private readonly RequestGate $gate,
        private readonly CsrfToken $token,
        private readonly FrontendAssets $assets,
        private readonly FlashMessage $flash,
    ) {
    }


    public function show(): Response
    {
        $stopped = $this->gate->guardGet();
        if ($stopped !== null) {
            return $stopped;
        }
        // Until the screens that queue it move to the API, a Twig POST's message is dropped here, not shown later.
        $this->flash->take();
        $shell = new Template($this->config, 'console:app.twig');
        $shell->data = ['token' => $this->token->token()] + $this->assets->references();

        return $shell;
    }
}
