<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

final readonly class ReadError
{
    public function __construct(
        public string $message,
        public int $line,
        public int $column,
    ) {
    }
}
