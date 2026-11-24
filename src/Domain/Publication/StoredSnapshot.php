<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Publication;

/**
 * A row of the Snapshot table: the bytes of the document and what protects them.
 */
final readonly class StoredSnapshot
{
    public function __construct(
        public int $number,
        public int $formatVersion,
        public string $checksum,
        public string $document,
    ) {
    }
}
