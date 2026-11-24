<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class InverseCertificates
{
    public function __construct(private readonly CertificateFiles $files)
    {
    }


    /**
     * @return list<string>
     */
    public static function options(): array
    {
        return ['keys', 'certData', 'certificate'];
    }


    /**
     * @param array<array-key, mixed> $options
     */
    public function convert(array $options): CertificateReading
    {
        $given = array_values(
            array_filter(self::options(), static fn (string $o): bool => ($options[$o] ?? []) !== []),
        );
        if ($given === []) {
            return new CertificateReading();
        }
        $source = $given[0];
        $ignored = array_map(
            static fn (string $o): Notice => new Notice("'$o' is ignored because '$source' is set, as core does.", $o),
            array_slice($given, 1),
        );
        $read = match ($source) {
            'keys' => $this->keys($options['keys']),
            'certData' => $this->certData($options['certData']),
            default => $this->file($options['certificate']),
        };

        return new CertificateReading($read->certificates, $read->errors, $ignored, $source);
    }


    private function keys(mixed $keys): CertificateReading
    {
        if (!is_array($keys)) {
            return new CertificateReading([], [new ValidationError('/keys', 'keys must be a list of keys.')]);
        }
        $certificates = [];
        $errors = [];
        foreach (array_values($keys) as $position => $key) {
            $found = $this->key($key);
            is_string($found)
                ? $errors[] = new ValidationError('/keys/' . $position, $found)
                : $certificates[] = $found;
        }

        return new CertificateReading($certificates, $errors);
    }


    /**
     * @return array{pem: string, use: string}|string the certificate, or why the key cannot be used
     */
    private function key(mixed $key): array|string
    {
        if (!is_array($key) || ($key['type'] ?? null) !== 'X509Certificate') {
            return 'Only keys of the type X509Certificate can be used.';
        }
        $use = $this->use($key);
        $body = $key['X509Certificate'] ?? null;
        if ($use === null) {
            return 'The key is neither for signing nor for encryption.';
        }

        return is_string($body)
            ? ['pem' => Pem::wrap(Pem::body($body)), 'use' => $use]
            : 'The key has no X509Certificate.';
    }


    /**
     * @param array<array-key, mixed> $key
     */
    private function use(array $key): ?string
    {
        $signing = (bool) ($key['signing'] ?? true);
        $encryption = (bool) ($key['encryption'] ?? true);

        return match (true) {
            $signing && $encryption => 'both',
            $signing => 'signing',
            $encryption => 'encryption',
            default => null,
        };
    }


    private function certData(mixed $data): CertificateReading
    {
        return is_string($data)
            ? new CertificateReading([['pem' => Pem::wrap(Pem::body($data)), 'use' => 'both']])
            : new CertificateReading([], [new ValidationError('/certData', 'certData must be a string.')]);
    }


    private function file(mixed $location): CertificateReading
    {
        $content = is_string($location) ? $this->files->read($location) : null;
        $pem = $content === null ? null : Pem::first($content);
        if ($pem === null) {
            $error = new ValidationError('/certificate', 'The certificate cannot be read from that location.');

            return new CertificateReading([], [$error]);
        }

        return new CertificateReading([['pem' => $pem, 'use' => 'both']]);
    }
}
