<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Domain\Entity\CertificateFiles;
use SimpleSAML\Module\console\Domain\Entity\ParsedEntity;
use SimpleSAML\Module\console\Domain\Entity\SchemaValidator;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Php\PhpReader;
use SimpleSAML\Module\console\Domain\Php\PhpReading;

final class SpText
{
    public const string ACS = "'AssertionConsumerService' => [['Binding' => "
        . "'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', 'Location' => 'https://sp.example.org/acs']],";


    public static function read(string $text): PhpReading
    {
        return (new PhpReader())->read($text);
    }


    /**
     * The text of a block holding the usual endpoint and the given options.
     */
    public static function parse(string $body, ?string $expected = null, ?CertificateFiles $files = null): ParsedEntity
    {
        return (new SpRemote($files))->fromText("[\n" . self::ACS . "\n" . $body . "\n]", $expected);
    }


    /**
     * @return list<string>
     */
    public static function pointers(ParsedEntity $parsed): array
    {
        return array_map(static fn ($e): string => $e->pointer, $parsed->errors);
    }


    /**
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public static function schemaErrors(array $document): array
    {
        return (new SchemaValidator(SpFixtures::SET))->validate($document);
    }


    public static function endpoints(string $endpoints, string $rest = ''): string
    {
        return "[\n'AssertionConsumerService' => [" . $endpoints . "],\n" . $rest . "\n]";
    }


    public static function endpoint(string $path, string $extra = ''): string
    {
        return "['Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', "
            . "'Location' => 'https://a.example.org/$path'$extra],";
    }


    public static function pdoError(string $state, int|string|null $driverCode, string $message = 'x'): \PDOException
    {
        $error = new \PDOException($message);
        $error->errorInfo = [$state, $driverCode, $message];

        return $error;
    }
}
