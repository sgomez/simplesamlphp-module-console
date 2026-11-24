<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class HeaderReading
{
    /**
     * @param array<array-key, mixed> $options
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    public function __construct(
        public ?string $entityId,
        public array $options,
        public array $errors,
        public array $notices,
    ) {
    }
}
