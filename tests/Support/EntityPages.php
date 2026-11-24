<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use Symfony\Component\HttpFoundation\Response;

final class EntityPages
{
    public const string LIST = '/entities/saml20-sp-remote';

    public const string NEW = '/entities/saml20-sp-remote/new';

    public const string SAVE = '/entities/saml20-sp-remote/save';

    public const string EDIT = '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fsp.example.org';


    public static function opened(): array
    {
        $client = (new ConsoleClient())->loginAsAdmin();

        return [$client, $client->page(self::NEW)];
    }


    public static function submitNew(ConsoleClient $client, string $html, string $entityId, string $php): Response
    {
        $token = self::field($html, '_token');

        return $client->post(self::SAVE, ['_token' => $token, 'entityid' => $entityId, 'php' => $php]);
    }


    public static function existing(): array
    {
        [$client, $html] = self::opened();
        self::submitNew($client, $html, 'https://sp.example.org', "[\n" . SpText::ACS . "\n'name' => 'Example',\n]");

        return [$client, $client->page(self::EDIT)];
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


    public static function submitEdit(
        ConsoleClient $client,
        string $html,
        string $php,
        ?string $version = null,
    ): Response {
        return $client->post(self::SAVE, [
            '_token' => self::field($html, '_token'),
            'entityid' => 'https://sp.example.org',
            'version' => $version ?? self::field($html, 'version'),
            'php' => $php,
        ]);
    }
}
