<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Application\Publication\EntityWarnings as Warnings;
use SimpleSAML\Module\console\Domain\Entity\SpRemoteWarnings;
use SimpleSAML\Module\console\Domain\Entity\Warning;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;

final class EntityWarnings implements Warnings
{
    private const string EXPIRING = 'Certificate expiring';


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
        $now = new \DateTimeImmutable();
        $warnings = new SpRemoteWarnings(ModuleConfig::certExpiryWarningDays());

        return array_map(
            static fn (Warning $w): array => [
                'label' => $w->label === self::EXPIRING ? self::expiring($document, $now) : $w->label,
                'message' => $w->message,
            ],
            $warnings->of($entityId, $document, $now),
        );
    }


    /**
     * @param array<string, mixed> $document
     */
    private static function expiring(array $document, \DateTimeImmutable $now): string
    {
        $ends = [];
        foreach ((array) ($document['certificates'] ?? []) as $certificate) {
            $pem = ((array) $certificate)['pem'] ?? null;
            $parsed = is_string($pem) ? @openssl_x509_parse($pem) : false;
            $end = is_array($parsed) ? ($parsed['validTo_time_t'] ?? null) : null;
            is_int($end) && $end >= $now->getTimestamp() && $ends[] = $end;
        }
        if ($ends === []) {
            return self::EXPIRING;
        }
        $days = (int) ceil((min($ends) - $now->getTimestamp()) / 86400);

        return 'Certificate expires in ' . $days . ($days === 1 ? ' day' : ' days');
    }
}
