<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class CertificateReading
{
    /**
     * @param list<array{pem: string, use: string}> $certificates
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     * @param string|null $source the option of the array the certificates came from
     */
    public function __construct(
        public array $certificates = [],
        public array $errors = [],
        public array $notices = [],
        public ?string $source = null,
    ) {
    }
}
