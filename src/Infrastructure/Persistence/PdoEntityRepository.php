<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Application\EntityAlreadyExists;
use SimpleSAML\Module\console\Application\EntityConflict;
use SimpleSAML\Module\console\Application\EntityRepository;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Timestamp;

final class PdoEntityRepository implements EntityRepository
{
    private readonly AuditTrail $audit;


    public function __construct(private readonly \PDO $pdo, private readonly string $prefix)
    {
        $this->audit = new AuditTrail($pdo, $prefix);
    }


    public function find(string $set, string $entityId): ?StoredEntity
    {
        $statement = $this->pdo->prepare(
            'SELECT ' . EntityRow::COLUMNS . ' FROM ' . $this->table() . ' WHERE entity_set = ? AND entity_id = ?',
        );
        $statement->execute([$set, $entityId]);
        $row = $statement->fetch();

        return is_array($row) ? EntityRow::hydrate($row) : null;
    }


    public function all(string $set): array
    {
        $statement = $this->pdo->prepare(
            'SELECT ' . EntityRow::COLUMNS . ' FROM ' . $this->table() . ' WHERE entity_set = ? ORDER BY entity_id',
        );
        $statement->execute([$set]);

        $entities = [];
        foreach ($statement->fetchAll() as $row) {
            is_array($row) && $entities[] = EntityRow::hydrate($row);
        }

        return $entities;
    }


    public function create(string $set, string $entityId, array $document, string $identity): void
    {
        $json = self::encode($document);
        $now = Timestamp::now();
        try {
            $this->transaction(function () use ($set, $entityId, $json, $now, $identity): void {
                $this->pdo->prepare(
                    'INSERT INTO ' . $this->table() . ' (' . EntityRow::COLUMNS . ', created_at, updated_at) '
                    . 'VALUES (?, ?, 1, ?, 1, ?, ?)',
                )->execute([$set, $entityId, $json, $now, $now]);
                $this->audit->recordEntity($identity, 'create', $set, $entityId, $json);
            });
        } catch (\PDOException $e) {
            throw ConflictShapes::isDuplicateKey($e) ? new EntityAlreadyExists('Entity already exists.', 0, $e) : $e;
        }
    }


    public function update(string $set, string $entityId, int $version, array $document, string $identity): int
    {
        $json = self::encode($document);
        try {
            $this->transaction(function () use ($set, $entityId, $version, $json, $identity): void {
                $statement = $this->pdo->prepare(
                    'UPDATE ' . $this->table() . ' SET document = ?, version = version + 1, updated_at = ? '
                    . 'WHERE entity_set = ? AND entity_id = ? AND version = ?',
                );
                $statement->execute([$json, Timestamp::now(), $set, $entityId, $version]);
                if ($statement->rowCount() !== 1) {
                    throw new EntityConflict('The entity changed or was deleted meanwhile.');
                }
                $this->audit->recordEntity($identity, 'edit', $set, $entityId, $json);
            });
        } catch (\PDOException $e) {
            throw ConflictShapes::isConflict($e) ? new EntityConflict('The write lost a race.', 0, $e) : $e;
        }

        return $version + 1;
    }


    private function transaction(\Closure $work): void
    {
        $this->pdo->beginTransaction();
        try {
            $work();
            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->inTransaction() && $this->pdo->rollBack();
            throw $e;
        }
    }


    private function table(): string
    {
        return $this->prefix . 'console_entity';
    }


    /**
     * @param array<string, mixed> $document
     */
    private static function encode(array $document): string
    {
        return json_encode($document, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    }
}
