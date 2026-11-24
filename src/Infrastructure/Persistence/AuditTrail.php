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


    public function recordPublication(string $identity, ?int $from, int $to, ?string $comment): void
    {
        $statement = $this->pdo->prepare(
            'INSERT INTO ' . $this->prefix . 'console_audit '
            . '(at, identity, action, snapshot_from, snapshot_to, comment) '
            . "VALUES (?, ?, 'publish', ?, ?, ?)",
        );
        $statement->execute([Timestamp::now(), $identity, $from, $to, $comment]);
    }


    public function recordEntity(
        string $identity,
        string $action,
        string $set,
        string $entityId,
        string $document,
    ): void {
        $statement = $this->pdo->prepare(
            'INSERT INTO ' . $this->prefix . 'console_audit '
            . '(at, identity, action, object_type, entity_set, entity_id, document) '
            . "VALUES (?, ?, ?, 'entity', ?, ?, ?)",
        );
        $statement->execute([Timestamp::now(), $identity, $action, $set, $entityId, $document]);
    }
}
