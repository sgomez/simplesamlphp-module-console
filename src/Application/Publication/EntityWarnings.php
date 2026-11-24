<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

interface EntityWarnings
{
    /**
     * The warnings of section 5.9 for one entity.
     *
     * @param array<string, mixed> $document
     * @return list<string>
     */
    public function of(string $set, string $entityId, array $document): array;
}
