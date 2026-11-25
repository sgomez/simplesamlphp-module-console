<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Application\Publication\EntityWarnings as Warnings;
use SimpleSAML\Module\console\Domain\Entity\SpRemoteWarnings;
use SimpleSAML\Module\console\Domain\Entity\Warning;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;

final class EntityWarnings implements Warnings
{
    public function of(string $set, string $entityId, array $document): array
    {
        return array_column($this->labels($entityId, $document), 'message');
    }


    /**
     * @param array<string, mixed> $document
     * @return list<array{label: string, message: string}>
     */
    public function labels(string $entityId, array $document): array
    {
        $warnings = new SpRemoteWarnings(ModuleConfig::certExpiryWarningDays());

        return array_map(
            static fn (Warning $w): array => ['label' => $w->label, 'message' => $w->message],
            $warnings->of($entityId, $document, new \DateTimeImmutable()),
        );
    }
}
