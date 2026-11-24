<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

final class NoEntityWarnings implements EntityWarnings
{
    public function of(string $set, string $entityId, array $document): array
    {
        return [];
    }
}
