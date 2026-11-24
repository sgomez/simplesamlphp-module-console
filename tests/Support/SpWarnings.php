<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Domain\Entity\SpRemoteWarnings;

final class SpWarnings
{
    /** The end of the validity of the certificate of the fixtures. */
    public const string VALID_TO = '2036-11-21T17:22:16+00:00';


    /**
     * @param array<string, mixed> $document
     * @return list<string>
     */
    public static function labels(
        array $document,
        string $entityId = 'https://sp.example.org',
        string $now = '2026-11-24T12:00:00+00:00',
    ): array {
        $warnings = (new SpRemoteWarnings(30))->of($entityId, $document, new \DateTimeImmutable($now));

        return array_map(static fn ($w): string => $w->label, $warnings);
    }
}
