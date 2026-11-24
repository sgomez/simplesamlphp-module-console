<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

final class ConsoleDatabase
{
    /**
     * A SQLite file holding the given migration numbers; null leaves it without a versions table.
     *
     * @param list<int>|null $applied
     */
    public static function create(?array $applied): string
    {
        $file = (string) getenv('CONSOLE_TEST_DIR') . '/db-' . bin2hex(random_bytes(6)) . '.sqlite';
        $pdo = self::open($file);
        if ($applied !== null) {
            $pdo->exec(
                'CREATE TABLE console_schema_version (version INTEGER NOT NULL PRIMARY KEY, applied_at CHAR(20))',
            );
            foreach ($applied as $number) {
                $pdo->exec("INSERT INTO console_schema_version VALUES ($number, '2026-11-24T10:15:00Z')");
            }
        }

        return $file;
    }


    public static function open(string $file): \PDO
    {
        $pdo = new \PDO('sqlite:' . $file);
        $pdo->setAttribute(\PDO::ATTR_DEFAULT_FETCH_MODE, \PDO::FETCH_ASSOC);

        return $pdo;
    }
}
