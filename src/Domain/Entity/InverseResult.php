<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class InverseResult
{
    /**
     * @param array<string, mixed> $document
     * @param array<string, string> $sources the option of the array each root option of the document comes from
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     * @param list<string> $unavailable the options of the array the Console does not take yet
     */
    public function __construct(
        public array $document,
        public array $sources,
        public array $errors,
        public array $notices,
        public array $unavailable,
    ) {
    }
}
