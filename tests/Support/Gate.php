<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Infrastructure\Http\DatabaseGate;
use SimpleSAML\Session;
use Symfony\Component\HttpFoundation\Request;

final class Gate
{
    public static function withToken(): array
    {
        $session = Session::getSessionFromRequest();
        $token = new CsrfToken($session);

        return [new ApiGate(new AdminAccess($session), new DatabaseGate(), $token), $token->token()];
    }


    /**
     * A gate over a SQLite library that reports the given version.
     */
    public static function withSqlite(string $version): ApiGate
    {
        $session = Session::getSessionFromRequest();

        return new ApiGate(
            new AdminAccess($session),
            new DatabaseGate(static fn (): string => $version),
            new CsrfToken($session),
        );
    }


    public static function post(array $headers, string $body = '{}'): Request
    {
        return Request::create('/module.php/console/api/x', 'POST', [], [], [], $headers, $body);
    }
}
