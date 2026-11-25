<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Domain\Entity\SchemaValidator;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;

final class ValidationParity
{
    public const string FILE = 'tests/Fixtures/validation-parity.json';


    public static function json(): string
    {
        $flags = JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR;

        return json_encode(self::cases(), $flags) . "\n";
    }


    /**
     * @return list<array{set: string, fixture: string, document: mixed, errors: list<array<string, string>>}>
     */
    public static function cases(): array
    {
        $cases = [];
        foreach (self::sets() as $set) {
            foreach (self::documents($set) as $fixture => $document) {
                $cases[] = [
                    'set' => $set,
                    'fixture' => $fixture,
                    'document' => $document,
                    'errors' => self::errors($set, $document),
                ];
            }
        }

        return $cases;
    }


    /**
     * @return list<string>
     */
    private static function sets(): array
    {
        $sets = [];
        foreach (glob(self::root() . '/tests/Fixtures/*', GLOB_ONLYDIR) ?: [] as $dir) {
            if (is_file(self::root() . '/docs/spec/schemas/entities/' . basename($dir) . '.json')) {
                $sets[] = basename($dir);
            }
        }

        return $sets;
    }


    /**
     * @return array<string, array<array-key, mixed>>
     */
    private static function documents(string $set): array
    {
        $dir = self::root() . '/tests/Fixtures/' . $set;
        $pem = substr(json_encode(SpFixtures::pem(), JSON_THROW_ON_ERROR), 1, -1);
        $documents = [];
        foreach (glob($dir . '/valid/*.json') ?: [] as $file) {
            $text = str_replace('@PEM@', $pem, (string) file_get_contents($file));
            $documents['valid/' . basename($file, '.json')] = self::decode($text);
        }
        foreach (self::decode((string) file_get_contents($dir . '/invalid.json')) as $case) {
            $documents['invalid/' . $case['name']] = $case['document'];
        }

        return $documents;
    }


    /**
     * @param array<array-key, mixed> $document
     * @return list<array{pointer: string, message: string}>
     */
    private static function errors(string $set, array $document): array
    {
        $errors = array_map(
            static fn (ValidationError $e): array => ['pointer' => $e->pointer, 'message' => $e->message],
            (new SchemaValidator($set))->validate($document),
        );
        usort($errors, static fn (array $a, array $b): int => array_values($a) <=> array_values($b));

        return $errors;
    }


    /**
     * @return array<array-key, mixed>
     */
    private static function decode(string $text): array
    {
        return (array) json_decode($text, true, 512, JSON_THROW_ON_ERROR);
    }


    private static function root(): string
    {
        return dirname(__DIR__, 2);
    }
}
