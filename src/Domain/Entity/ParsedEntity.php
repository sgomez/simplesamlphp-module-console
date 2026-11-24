<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

use SimpleSAML\Module\console\Domain\Php\ReadError;

final readonly class ParsedEntity
{
    /**
     * @param array<string, mixed>|null $document
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    public function __construct(
        public ?string $entityId,
        public ?array $document,
        public array $errors = [],
        public array $notices = [],
    ) {
    }


    public static function unreadable(ReadError $error): self
    {
        return new self(null, null, [new ValidationError('', $error->message, $error->line, $error->column)]);
    }


    public function isValid(): bool
    {
        return $this->errors === [] && $this->document !== null;
    }
}
