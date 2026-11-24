<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class Pem
{
    private const string BEGIN = '-----BEGIN CERTIFICATE-----';

    private const string END = '-----END CERTIFICATE-----';


    /** The certificate as PEM with 64-character lines, or null when the text is not exactly one certificate. */
    public static function normalise(string $text): ?string
    {
        if (substr_count($text, '-----BEGIN') > 1) {
            return null;
        }
        $body = self::body($text);
        if (preg_match('/^[A-Za-z0-9+\/]+={0,2}$/', $body) !== 1) {
            return null;
        }
        $pem = self::wrap($body);
        set_error_handler(static fn (): bool => true);
        try {
            $certificate = openssl_x509_read($pem);
        } finally {
            restore_error_handler();
        }

        return $certificate === false ? null : $pem;
    }


    public static function wrap(string $body): string
    {
        return self::BEGIN . "\n" . chunk_split($body, 64, "\n") . self::END . "\n";
    }


    /** The base64 of a certificate, without armour or white space. */
    public static function body(string $text): string
    {
        return (string) preg_replace('/-----(BEGIN|END) CERTIFICATE-----|\s+/', '', $text);
    }


    /** The first certificate block of a file, as core reads it. */
    public static function first(string $content): ?string
    {
        $found = preg_match('/' . self::BEGIN . '([^-]*)' . self::END . '/', $content, $matches);

        return $found === 1 ? self::wrap(self::body($matches[1])) : null;
    }
}
