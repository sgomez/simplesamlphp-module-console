<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

use SimpleSAML\Module\console\Domain\Publication\PendingChange;

final readonly class PublicationReview
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $changes the Pending changes
     * @param array<string, string> $names the names of the changes, by set and entity ID
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $problems
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $warnings
     */
    public function __construct(
        public array $changes,
        private array $names,
        public array $problems,
        public array $warnings,
        public string $hash,
        public int $nextNumber,
        public ?int $currentNumber,
        public ?string $currentCreatedAt,
    ) {
    }


    public function name(PendingChange $change): ?string
    {
        return $this->names[$change->set . "\0" . $change->entityId] ?? null;
    }


    public function canPublish(): bool
    {
        return $this->changes !== [] && $this->problems === [];
    }
}
