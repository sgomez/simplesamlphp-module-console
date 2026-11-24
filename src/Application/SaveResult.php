<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

final readonly class SaveResult
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    private function __construct(
        public SaveOutcome $outcome,
        public ?string $entityId = null,
        public ?int $version = null,
        public ?string $text = null,
        public array $errors = [],
        public array $notices = [],
    ) {
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    public static function saved(string $entityId, int $version, string $text, array $notices): self
    {
        return new self(SaveOutcome::Saved, $entityId, $version, $text, [], $notices);
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    public static function invalid(array $errors, array $notices): self
    {
        return new self(SaveOutcome::Invalid, errors: $errors, notices: $notices);
    }


    public static function alreadyExists(string $entityId): self
    {
        return new self(SaveOutcome::AlreadyExists, $entityId);
    }


    public static function conflict(): self
    {
        return new self(SaveOutcome::Conflict);
    }
}
