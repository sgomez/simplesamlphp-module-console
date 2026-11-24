<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\Timestamp;

final class AuditTrail
{
    public function __construct(
        private readonly \PDO $pdo,
        private readonly string $prefix,
    ) {
    }


    public function recordMigration(string $identity, int $schemaVersion): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO ' . $this->prefix . 'console_audit (at, identity, action, schema_version) '
            . "VALUES (?, ?, 'migrate', ?)",
        );
        $statement->execute([Timestamp::now(), $identity, $schemaVersion]);
    }
}
