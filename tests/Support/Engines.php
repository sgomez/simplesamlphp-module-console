<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;

final class Engines
{
    private const array VARIABLES = [
        'sqlite' => 'CONSOLE_TEST_DSN_SQLITE',
        'postgresql' => 'CONSOLE_TEST_DSN_POSTGRES',
        'mariadb' => 'CONSOLE_TEST_DSN_MARIADB',
        'mariadb-newest' => 'CONSOLE_TEST_DSN_MARIADB_NEWEST',
        'mysql' => 'CONSOLE_TEST_DSN_MYSQL',
    ];

    private const array TABLES = ['audit', 'node', 'pointer', 'snapshot', 'authsource', 'entity', 'schema_version'];


    /**
     * One dataset row per engine whose DSN is set; SQLite in memory when none is.
     *
     * @return array<string, array{string}>
     */
    public static function datasets(): array
    {
        $rows = [];
        foreach (self::VARIABLES as $name => $variable) {
            if ((string) getenv($variable) !== '') {
                $rows[$name] = [$name];
            }
        }

        return $rows === [] ? ['sqlite' => ['sqlite']] : $rows;
    }


    public static function settings(string $engine, string $prefix): DatabaseSettings
    {
        $dsn = (string) getenv(self::VARIABLES[$engine]);
        $user = (string) getenv('CONSOLE_TEST_DB_USER');
        if ($engine === 'sqlite' && ($dsn === '' || str_contains($dsn, ':memory:'))) {
            // a second connection to the same database is needed for the races
            $dsn = 'sqlite:' . getenv('CONSOLE_TEST_DIR') . '/engine-' . bin2hex(random_bytes(6)) . '.sqlite';
        }

        return new DatabaseSettings(
            $dsn,
            $user === '' ? null : $user,
            $user === '' ? null : (string) getenv('CONSOLE_TEST_DB_PASSWORD'),
            $prefix,
        );
    }


    public static function prefix(): string
    {
        return 't' . bin2hex(random_bytes(4)) . '_';
    }


    public static function connect(DatabaseSettings $settings): \PDO
    {
        return (new ConnectionFactory())->open($settings);
    }


    public static function dropAll(\PDO $pdo, DatabaseSettings $settings): void
    {
        foreach (self::TABLES as $table) {
            $pdo->exec('DROP TABLE IF EXISTS ' . $settings->table($table));
        }
    }
}
