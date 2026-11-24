<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Domain\Entity\CertificateExpiry;
use SimpleSAML\Module\console\Domain\Entity\SpRemoteWarnings;
use SimpleSAML\Module\console\Domain\Entity\Warning;

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


    public static function expiryAt(string $now, mixed $certificates = null): array
    {
        $document = ['certificates' => $certificates ?? [['pem' => SpFixtures::pem(), 'use' => 'both']]];
        $at = (new \DateTimeImmutable(SpWarnings::VALID_TO))->modify($now);

        return array_map(
            static fn (Warning $w): array => [$w->label, $w->message],
            (new CertificateExpiry(30))->warnings($document, $at),
        );
    }


    public static function warningMessages(array $options): array
    {
        $document = $options + SpFixtures::document('minimal');
        $now = new \DateTimeImmutable('2026-11-24');
        $warnings = (new SpRemoteWarnings(30))->of('https://sp.example.org', $document, $now);

        return array_map(static fn (Warning $w): string => $w->message, $warnings);
    }
}
