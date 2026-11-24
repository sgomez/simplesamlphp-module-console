<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;

interface EntityRepository
{
    public function find(string $set, string $entityId): ?StoredEntity;


    /**
     * The entities of the set, ordered bytewise by entity ID.
     *
     * @return list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity>
     */
    public function all(string $set): array;


    /**
     * Creates the entity, enabled, and writes its `create` row of the Audit trail in the same transaction.
     *
     * @param array<string, mixed> $document
     * @throws \SimpleSAML\Module\console\Application\EntityAlreadyExists
     */
    public function create(string $set, string $entityId, array $document, string $identity): void;


    /**
     * Replaces the document when the stored version is the given one, and writes the `edit` row of the Audit
     * trail in the same transaction. Returns the new version.
     *
     * @param array<string, mixed> $document
     * @throws \SimpleSAML\Module\console\Application\EntityConflict
     */
    public function update(string $set, string $entityId, int $version, array $document, string $identity): int;
}
