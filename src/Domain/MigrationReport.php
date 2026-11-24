<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

final readonly class MigrationReport
{
    /**
     * @param list<int> $applied the migrations this run applied
     */
    public function __construct(
        public MigrationOutcome $outcome,
        public array $applied = [],
        public ?int $failedAt = null,
        public ?string $reason = null,
    ) {
    }
}
