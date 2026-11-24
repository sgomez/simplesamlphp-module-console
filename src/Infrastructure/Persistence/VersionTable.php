<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\Timestamp;

final class VersionTable
{
    private readonly string $table;


    public function __construct(
        private readonly \PDO $pdo,
        string $prefix,
    ) {
        $this->table = $prefix . 'console_schema_version';
    }


    public function create(): void
    {
        $mysql = $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'mysql';
        $this->pdo->exec(
            'CREATE TABLE IF NOT EXISTS ' . $this->table
            . ' (version ' . ($mysql ? 'INT' : 'INTEGER') . ' NOT NULL PRIMARY KEY, applied_at CHAR(20) NOT NULL)'
            . ($mysql ? ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4' : ''),
        );
    }


    /**
     * @return list<int>
     */
    public function applied(): array
    {
        $rows = $this->pdo->query('SELECT version FROM ' . $this->table);
        $numbers = $rows === false ? [] : $rows->fetchAll(\PDO::FETCH_COLUMN);

        return array_values(array_map(static fn (mixed $n): int => is_numeric($n) ? (int) $n : 0, $numbers));
    }


    public function record(int $number): void
    {
        $this->pdo
            ->prepare('INSERT INTO ' . $this->table . ' (version, applied_at) VALUES (?, ?)')
            ->execute([$number, Timestamp::now()]);
    }
}
