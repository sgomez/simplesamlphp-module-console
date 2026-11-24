<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Publication;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;

/**
 * The state of each object against the current Snapshot (section 8.2). There is no state column.
 */
final class PendingChanges
{
    /**
     * Every enabled saved entity with its state, then the Deleted ones; sorted by set and entity ID.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $saved
     * @return list<\SimpleSAML\Module\console\Domain\Publication\PendingChange>
     */
    public static function compute(array $saved, SnapshotContent $current): array
    {
        $changes = [];
        $present = [];
        foreach ($saved as $entity) {
            $present[$entity->set][$entity->entityId] = true;
            $entity->enabled && $changes[] = self::change($entity, $current);
        }
        foreach (SnapshotContent::SETS as $set) {
            foreach ($current->entityIds($set) as $entityId) {
                isset($present[$set][$entityId])
                    || $changes[] = new PendingChange($set, $entityId, EntityState::Deleted, null);
            }
        }
        usort($changes, static fn (PendingChange $a, PendingChange $b): int => strcmp(
            $a->set . "\0" . $a->entityId,
            $b->set . "\0" . $b->entityId,
        ));

        return $changes;
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $changes
     * @return list<\SimpleSAML\Module\console\Domain\Publication\PendingChange>
     */
    public static function pending(array $changes): array
    {
        return array_values(array_filter(
            $changes,
            static fn (PendingChange $change): bool => $change->state->isPending(),
        ));
    }


    /**
     * A hash of the keys and versions of the Pending changes, carried by the confirmation screen.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $changes
     */
    public static function hash(array $changes): string
    {
        $lines = array_map(
            static fn (PendingChange $change): string => $change->set . "\0" . $change->entityId . "\0"
                . ($change->version ?? 'deleted'),
            self::pending($changes),
        );
        usort($lines, strcmp(...));

        return hash('sha256', implode("\n", $lines));
    }


    private static function change(StoredEntity $entity, SnapshotContent $current): PendingChange
    {
        $published = $current->document($entity->set, $entity->entityId);
        $state = match (true) {
            $entity->document === null => EntityState::Unreadable,
            $published === null => EntityState::Unpublished,
            self::encode($published) === self::encode($entity->document) => EntityState::UpToDate,
            default => EntityState::Modified,
        };

        return new PendingChange($entity->set, $entity->entityId, $state, $entity->version, $entity->loadError);
    }


    /**
     * @param array<array-key, mixed> $document
     */
    private static function encode(array $document): string
    {
        return json_encode($document, JSON_THROW_ON_ERROR);
    }
}
