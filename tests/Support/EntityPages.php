<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

final class EntityPages
{
    public const string LIST = '/entities/saml20-sp-remote';


    public static function count(ConsoleClient $client, string $table, string $where = '1 = 1'): int
    {
        $rows = $client->database()->query('SELECT COUNT(*) FROM ' . $table . ' WHERE ' . $where);

        return $rows === false ? -1 : (int) $rows->fetchColumn();
    }
}
