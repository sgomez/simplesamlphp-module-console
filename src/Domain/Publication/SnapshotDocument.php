<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Publication;

/**
 * The document of a Snapshot (section 4.4): lists, not maps, sorted bytewise, content only.
 */
final class SnapshotDocument
{
    /**
     * The bytes of the Snapshot holding the enabled, loadable entities.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $entities
     */
    public static function build(array $entities): string
    {
        $sets = array_fill_keys(SnapshotContent::SETS, []);
        foreach ($entities as $entity) {
            if ($entity->enabled && $entity->document !== null && isset($sets[$entity->set])) {
                $sets[$entity->set][$entity->entityId] = $entity->document;
            }
        }

        return json_encode(
            ['entities' => array_map(self::list(...), $sets), 'authsources' => []],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR,
        );
    }


    /**
     * @param array<array-key, array<string, mixed>> $documents
     * @return list<array{entityid: string, document: array<string, mixed>|\stdClass}>
     */
    private static function list(array $documents): array
    {
        $ids = array_map(strval(...), array_keys($documents));
        usort($ids, strcmp(...));

        return array_map(
            static fn (string $id): array => [
                'entityid' => $id,
                'document' => $documents[$id] === [] ? new \stdClass() : $documents[$id],
            ],
            $ids,
        );
    }
}
