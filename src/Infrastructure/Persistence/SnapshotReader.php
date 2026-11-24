<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\Publication\StoredSnapshot;

final class SnapshotReader
{
    public function __construct(private readonly \PDO $pdo, private readonly string $prefix)
    {
    }


    public function find(int $number): ?StoredSnapshot
    {
        $statement = $this->pdo->prepare(
            'SELECT format_version, checksum, document FROM ' . $this->prefix . 'console_snapshot WHERE number = ?',
        );
        $statement->execute([$number]);
        $row = $statement->fetch(\PDO::FETCH_ASSOC);
        if (!is_array($row)) {
            return null;
        }
        [$format, $checksum, $document] = array_map(
            static fn (mixed $value): string => is_scalar($value) ? (string) $value : '',
            [$row['format_version'] ?? null, $row['checksum'] ?? null, $row['document'] ?? null],
        );

        return new StoredSnapshot($number, (int) $format, $checksum, $document);
    }
}
