<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class Notice
{
    public function __construct(
        public string $message,
        public ?string $option = null,
        public ?int $line = null,
    ) {
    }


    public function at(?int $line): self
    {
        return new self($this->message, $this->option, $line);
    }
}
