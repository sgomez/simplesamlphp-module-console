<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\EntityState;
use SimpleSAML\Module\console\Domain\Publication\PendingChange;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;

final readonly class PendingEntities
{
    /** @var array<string, \SimpleSAML\Module\console\Domain\Entity\StoredEntity> */
    private array $saved;

    private SnapshotContent $current;


    public function __construct(PublicationInput $input)
    {
        $saved = [];
        foreach ($input->entities as $entity) {
            $saved[$entity->set . "\0" . $entity->entityId] = $entity;
        }
        $this->saved = $saved;
        $this->current = SnapshotContent::parse($input->currentDocument);
    }


    public function saved(PendingChange $change): ?StoredEntity
    {
        return $this->saved[$change->set . "\0" . $change->entityId] ?? null;
    }


    /**
     * The names by set and entity ID; a Deleted change's from the current Snapshot.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $pending
     * @return array<string, string>
     */
    public function names(array $pending): array
    {
        $names = [];
        foreach ($pending as $change) {
            $name = $change->state === EntityState::Deleted
                ? $this->published($change)->name()
                : $this->saved($change)?->name();
            $name === null || $names[$change->set . "\0" . $change->entityId] = $name;
        }

        return $names;
    }


    private function published(PendingChange $change): StoredEntity
    {
        $document = $this->current->document($change->set, $change->entityId) ?? [];

        return new StoredEntity(
            $change->set,
            $change->entityId,
            true,
            0,
            array_filter($document, is_string(...), ARRAY_FILTER_USE_KEY),
        );
    }
}
