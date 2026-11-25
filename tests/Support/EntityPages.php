<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Session;

final class EntityPages
{
    public const string LIST = '/entities/saml20-sp-remote';


    /**
     * The request-forgery token of the session the client logged in with.
     */
    public static function token(): string
    {
        return (new CsrfToken(Session::getSessionFromRequest()))->token();
    }


    public static function field(string $html, string $name): string
    {
        preg_match('/name="' . preg_quote($name, '/') . '" value="([^"]*)"/', $html, $matches);

        return html_entity_decode($matches[1] ?? '', ENT_QUOTES);
    }


    public static function count(ConsoleClient $client, string $table, string $where = '1 = 1'): int
    {
        $rows = $client->database()->query('SELECT COUNT(*) FROM ' . $table . ' WHERE ' . $where);

        return $rows === false ? -1 : (int) $rows->fetchColumn();
    }
}
