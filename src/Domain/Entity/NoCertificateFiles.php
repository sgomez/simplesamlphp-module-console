<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class NoCertificateFiles implements CertificateFiles
{
    public function read(string $location): ?string
    {
        return null;
    }
}
