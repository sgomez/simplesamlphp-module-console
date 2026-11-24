<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Domain\SqliteVersion;
use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;

final class StateInspector
{
    private const array MISSING_TABLE_STATES = ['42S02', '42P01'];


    public function __construct(
        private readonly ConnectionFactory $connections,
        private readonly DatabaseSettings $settings,
        private readonly int $known,
        private readonly ?\Closure $sqliteVersion = null,
    ) {
    }


    public function inspect(): DatabaseStatus
    {
        try {
            $pdo = $this->connections->open($this->settings);
            $sqlite = $this->sqliteVersion($pdo);
            if ($sqlite !== null && !SqliteVersion::isSupported($sqlite)) {
                return DatabaseStatus::sqliteTooOld($sqlite);
            }

            return DatabaseStatus::ofSchema($this->applied($pdo), $this->known);
        } catch (\PDOException) {
            return DatabaseStatus::unreachable();
        }
    }


    private function sqliteVersion(\PDO $pdo): ?string
    {
        if ($pdo->getAttribute(\PDO::ATTR_DRIVER_NAME) !== 'sqlite') {
            return null;
        }
        $version = $this->sqliteVersion !== null
            ? ($this->sqliteVersion)()
            : $pdo->getAttribute(\PDO::ATTR_SERVER_VERSION);

        return is_string($version) ? $version : null;
    }


    /**
     * @return list<int>|null null when the versions table does not exist
     */
    private function applied(\PDO $pdo): ?array
    {
        $table = $this->settings->table('schema_version');
        try {
            $rows = $pdo->query('SELECT version FROM ' . $table, \PDO::FETCH_COLUMN, 0);
            $numbers = $rows === false ? [] : $rows->fetchAll();
        } catch (\PDOException $e) {
            if ($this->isMissingTable($e)) {
                return null;
            }
            throw $e;
        }

        return array_values(array_map(static fn (mixed $v): int => is_numeric($v) ? (int) $v : 0, $numbers));
    }


    private function isMissingTable(\PDOException $e): bool
    {
        return in_array($e->errorInfo[0] ?? $e->getCode(), self::MISSING_TABLE_STATES, true)
            || str_contains($e->getMessage(), 'no such table');
    }
}
