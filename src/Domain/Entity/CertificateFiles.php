<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

interface CertificateFiles
{
    /** The content at a file name or `pdo://` location, read as core reads it, or null when it cannot be read. */
    public function read(string $location): ?string;
}
