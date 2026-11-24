<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Publication;

final readonly class PendingChange
{
    /**
     * @param int|null $version null for a Deleted entity, which has no row left
     */
    public function __construct(
        public string $set,
        public string $entityId,
        public EntityState $state,
        public ?int $version,
        public ?string $loadError = null,
    ) {
    }
}
