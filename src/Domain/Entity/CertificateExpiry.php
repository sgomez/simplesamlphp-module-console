<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class CertificateExpiry
{
    public function __construct(private readonly int $days)
    {
    }


    /**
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\Warning>
     */
    public function warnings(array $document, \DateTimeImmutable $now): array
    {
        $ends = array_filter(array_map(
            static fn (mixed $c): ?int => self::validTo(((array) $c)['pem'] ?? null),
            (array) ($document['certificates'] ?? []),
        ), static fn (?int $end): bool => $end !== null);
        $limit = $now->getTimestamp() + $this->days * 86400;
        $expired = array_filter($ends, static fn (int $end): bool => $end < $now->getTimestamp());
        $expiring = array_filter($ends, static fn (int $end): bool => $end >= $now->getTimestamp() && $end < $limit);

        return array_values(array_filter([
            $expired === [] ? null : new Warning('Certificate expired', 'A certificate has expired.'),
            $expiring === [] ? null : new Warning(
                'Certificate expiring',
                'A certificate expires within ' . $this->days . ' days.',
            ),
        ]));
    }


    private static function validTo(mixed $pem): ?int
    {
        $parsed = is_string($pem) ? @openssl_x509_parse($pem) : false;

        return $parsed === false || !is_int($parsed['validTo_time_t'] ?? null) ? null : $parsed['validTo_time_t'];
    }
}
