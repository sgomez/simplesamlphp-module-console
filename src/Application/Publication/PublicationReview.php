<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

final readonly class PublicationReview
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $changes the Pending changes
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $problems
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $warnings
     */
    public function __construct(
        public array $changes,
        public array $problems,
        public array $warnings,
        public string $hash,
        public int $nextNumber,
        public ?int $currentNumber,
        public ?string $currentCreatedAt,
    ) {
    }


    public function canPublish(): bool
    {
        return $this->changes !== [] && $this->problems === [];
    }
}
