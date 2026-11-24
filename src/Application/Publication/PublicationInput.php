<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

final readonly class PublicationInput
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $entities
     */
    public function __construct(
        public array $entities,
        public ?int $currentNumber,
        public int $lastNumber,
        public ?string $currentDocument,
        public ?string $currentCreatedAt,
    ) {
    }
}
