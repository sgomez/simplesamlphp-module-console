<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;

final class ConnectionFactory
{
    public function open(DatabaseSettings $settings): \PDO
    {
        $options = [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_PERSISTENT => false,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
        ];
        if (str_starts_with($settings->dsn, 'mysql:')) {
            $options[\PDO::ATTR_EMULATE_PREPARES] = false;
        }

        $pdo = new \PDO(self::dsn($settings->dsn), $settings->username, $settings->password, $options);
        if ($pdo->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'sqlite') {
            $pdo->exec('PRAGMA foreign_keys = ON');
        }

        return $pdo;
    }


    public static function dsn(string $dsn): string
    {
        if (str_starts_with($dsn, 'mysql:') && !str_contains($dsn, 'charset=')) {
            return rtrim($dsn, ';') . ';charset=utf8mb4';
        }

        return $dsn;
    }
}
