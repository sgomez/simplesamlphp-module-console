<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

final readonly class PhpReading
{
    public function __construct(
        public ?PhpBlock $block,
        public ?ReadError $error = null,
    ) {
    }
}
