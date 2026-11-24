<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Core;

use SimpleSAML\Module\console\Domain\Entity\CertificateFiles;
use SimpleSAML\Utils\Crypto;

final class CoreCertificateFiles implements CertificateFiles
{
    public function read(string $location): ?string
    {
        set_error_handler(static fn (): bool => true);
        try {
            return (new Crypto())->retrieveCertificate($location);
        } catch (\Throwable) {
            return null;
        } finally {
            restore_error_handler();
        }
    }
}
