<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class Warning
{
    public function __construct(public string $label, public string $message)
    {
    }
}
