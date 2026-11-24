<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

final class SpFixtures
{
    public const string SET = 'saml20-sp-remote';


    /**
     * @return array<string, array{string}>
     */
    public static function valid(): array
    {
        $names = [];
        foreach (glob(self::dir() . '/valid/*.json') ?: [] as $file) {
            $names[basename($file, '.json')] = [basename($file, '.json')];
        }

        return $names;
    }


    /**
     * @return array<string, array{string, array<string, mixed>}>
     */
    public static function invalid(): array
    {
        $cases = [];
        foreach (self::json(self::dir() . '/invalid.json') as $case) {
            $cases[(string) $case['name']] = [(string) $case['pointer'], $case['document']];
        }

        return $cases;
    }


    /**
     * @return array<string, mixed>
     */
    public static function document(string $name): array
    {
        $text = str_replace('@PEM@', substr(json_encode(self::pem()), 1, -1), self::read($name . '.json'));

        return json_decode($text, true, 512, JSON_THROW_ON_ERROR);
    }


    /**
     * The array core receives from the flat file of the fixture.
     *
     * @return array{string, array<string, mixed>}
     */
    public static function flatFile(string $name): array
    {
        $file = (string) getenv('CONSOLE_TEST_DIR') . '/flat-' . $name . '.php';
        file_put_contents($file, str_replace('@B64@', self::body(), self::read($name . '.php')));
        $metadata = [];
        include $file;

        return [(string) array_key_first($metadata), reset($metadata)];
    }


    public static function pem(): string
    {
        return "-----BEGIN CERTIFICATE-----\n" . chunk_split(self::body(), 64, "\n") . "-----END CERTIFICATE-----\n";
    }


    public static function body(): string
    {
        $example = self::json(dirname(__DIR__, 2) . '/docs/spec/examples/entities/saml20-sp-remote.json');

        return (string) preg_replace('/-----[A-Z ]+-----|\s+/', '', (string) $example['certificates'][0]['pem']);
    }


    private static function read(string $file): string
    {
        return (string) file_get_contents(self::dir() . '/valid/' . $file);
    }


    /**
     * @return array<array-key, mixed>
     */
    private static function json(string $file): array
    {
        return json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    }


    private static function dir(): string
    {
        return dirname(__DIR__) . '/Fixtures/' . self::SET;
    }
}
