<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Configuration;
use SimpleSAML\Logger;
use SimpleSAML\Module;
use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\XHTML\Template;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequestGate
{
    public const string TOKEN_FIELD = '_token';


    public function __construct(
        private readonly Configuration $config,
        private readonly AdminAccess $access,
        private readonly DatabaseGate $database,
        private readonly CsrfToken $token,
    ) {
    }


    /**
     * The response that stops a GET, or null when it may go on.
     */
    public function guardGet(): ?Response
    {
        $this->access->requireAdmin();

        return $this->toStatePage();
    }


    /**
     * The response that stops a POST, or null when it may go on: the admin login, then the database state,
     * then the request-forgery token.
     */
    public function guardPost(Request $request): ?Response
    {
        $this->access->requireAdmin();
        $statePage = $this->toStatePage();
        if ($statePage !== null) {
            return $statePage;
        }
        $submitted = $request->request->get(self::TOKEN_FIELD);
        if ($this->token->isValid(is_string($submitted) ? $submitted : null)) {
            return null;
        }
        Logger::warning(
            'Console: refused a POST to ' . $request->getPathInfo() . ' without a valid request-forgery token',
        );

        return $this->forbidden();
    }


    /**
     * A database that is not ready sends the request to the page shell, whose interface shows the state page.
     */
    private function toStatePage(): ?RedirectResponse
    {
        return $this->database->reading()->status->state === DatabaseState::Ready
            ? null
            : new RedirectResponse(Module::getModuleURL('console/'));
    }


    private function forbidden(): Template
    {
        $template = new Template($this->config, 'console:forbidden.twig');
        $template->data = [
            'identity' => $this->access->identity(),
            'adminUrl' => Module::getModuleURL('admin/'),
            'logoutUrl' => $this->access->logoutUrl(),
            'consoleUrl' => Module::getModuleURL('console/'),
        ];
        $template->setStatusCode(403);

        return $template;
    }
}
