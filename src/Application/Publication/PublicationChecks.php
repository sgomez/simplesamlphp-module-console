<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;

/**
 * What blocks a Publication (sections 4.9 and 5.8). Every enabled entity is validated again, not only those with
 * Pending changes.
 */
final class PublicationChecks
{
    private const int HEADROOM = 1048576;


    public function __construct(
        private readonly SpRemote $set,
        private readonly ProcessingFilterClasses $filters,
    ) {
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $entities
     * @return list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem>
     */
    public function problems(array $entities, string $document, ?int $limit): array
    {
        $problems = [];
        foreach ($entities as $entity) {
            $entity->enabled && array_push($problems, ...$this->ofEntity($entity));
        }
        $limit !== null && strlen($document) > $limit - self::HEADROOM && $problems[] = new PublicationProblem(
            null,
            sprintf(
                'The Snapshot takes %d bytes, more than the database accepts: max_allowed_packet (%d bytes) minus '
                . '1 MiB. Raise max_allowed_packet.',
                strlen($document),
                $limit,
            ),
        );

        return $problems;
    }


    /**
     * @return list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem>
     */
    private function ofEntity(StoredEntity $entity): array
    {
        if ($entity->document === null) {
            return [new PublicationProblem($entity->entityId, 'The row cannot be loaded: ' . $entity->loadError)];
        }
        $messages = [];
        foreach ($this->set->check($entity->document) as $error) {
            $messages[] = ($error->pointer === '' ? '' : $error->pointer . ': ') . $error->message;
        }
        foreach ($this->unresolvedFilters($entity->document) as $class) {
            $messages[] = 'The processing filter class ' . $class . ' does not resolve on this node.';
        }

        return array_map(
            static fn (string $message): PublicationProblem => new PublicationProblem(
                $entity->entityId,
                $message,
                $entity->name(),
            ),
            $messages,
        );
    }


    /**
     * @param array<string, mixed> $document
     * @return list<string>
     */
    private function unresolvedFilters(array $document): array
    {
        $unresolved = [];
        foreach ((array) ($document['authproc'] ?? []) as $row) {
            $class = ((array) (((array) $row)['filter'] ?? []))['class'] ?? null;
            is_string($class) && !$this->filters->resolves($class) && $unresolved[] = $class;
        }

        return $unresolved;
    }
}
