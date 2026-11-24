<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class ValidationError
{
    public function __construct(
        public string $pointer,
        public string $message,
        public ?int $line = null,
        public ?int $column = null,
    ) {
    }


    public function at(?int $line, ?int $column = null): self
    {
        return new self($this->pointer, $this->message, $line, $column);
    }
}
