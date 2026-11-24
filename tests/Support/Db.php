<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

final class Db
{
    /**
     * @return array{\PDO, \SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings}
     */
    public static function fresh(string $engine): array
    {
        $settings = Engines::settings($engine, Engines::prefix());

        return [Engines::connect($settings), $settings];
    }


    public static function tableExists(\PDO $pdo, string $table): bool
    {
        try {
            $pdo->query('SELECT 1 FROM ' . $table . ' WHERE 1 = 0');

            return true;
        } catch (\PDOException) {
            return false;
        }
    }


    /**
     * @return list<int>
     */
    public static function applied(\PDO $pdo, string $table): array
    {
        $rows = $pdo->query('SELECT version FROM ' . $table . ' ORDER BY version');

        return array_map('intval', $rows === false ? [] : $rows->fetchAll(\PDO::FETCH_COLUMN));
    }


    public static function count(\PDO $pdo, string $table): int
    {
        $rows = $pdo->query('SELECT COUNT(*) FROM ' . $table);

        return $rows === false ? -1 : (int) $rows->fetchAll(\PDO::FETCH_COLUMN)[0];
    }
}
