<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

final readonly class Migration
{
    /**
     * @param array<string, string> $sql the statement per PDO driver name: pgsql, mysql, sqlite
     */
    public function __construct(
        public int $number,
        private array $sql,
    ) {
    }


    public static function uniform(int $number, string $sql): self
    {
        return new self($number, ['pgsql' => $sql, 'mysql' => $sql, 'sqlite' => $sql]);
    }


    public function sqlFor(string $driver, string $prefix): string
    {
        $sql = $this->sql[$driver] ?? throw new \LogicException('No SQL for the driver ' . $driver);

        return str_replace('console_', $prefix . 'console_', $sql);
    }
}
