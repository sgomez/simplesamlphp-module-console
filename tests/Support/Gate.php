<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Configuration;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Infrastructure\Http\DatabaseGate;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\StatePages;
use SimpleSAML\Session;
use Symfony\Component\HttpFoundation\Request;

final class Gate
{
    public static function withToken(): array
    {
        $session = Session::getSessionFromRequest();
        $access = new AdminAccess($session);
        $token = new CsrfToken($session);
        $pages = new StatePages(Configuration::getInstance(), $access, $token, new FlashMessage($session));

        return [new ApiGate($access, new DatabaseGate($pages), $token), $token->token()];
    }


    public static function post(array $headers, string $body = '{}'): Request
    {
        return Request::create('/module.php/console/api/x', 'POST', [], [], [], $headers, $body);
    }
}
