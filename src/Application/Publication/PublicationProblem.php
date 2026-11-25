<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

final readonly class PublicationProblem
{
    public function __construct(public ?string $entityId, public string $message, public ?string $name = null)
    {
    }
}
