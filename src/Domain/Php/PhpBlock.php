<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

final readonly class PhpBlock
{
    /**
     * @param array<array-key, mixed> $options
     * @param array<string, int> $lines the line of each root option
     */
    public function __construct(
        public ?string $entityId,
        public array $options,
        public array $lines,
        public int $line,
    ) {
    }
}
