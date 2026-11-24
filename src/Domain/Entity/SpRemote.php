<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

use SimpleSAML\Module\console\Domain\Php\PhpExporter;
use SimpleSAML\Module\console\Domain\Php\PhpReader;

final class SpRemote
{
    public const string SET = 'saml20-sp-remote';

    private const string STARTER_BINDING = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';


    private readonly SchemaCatalog $catalog;

    private readonly SchemaValidator $schema;

    private readonly SpRemoteRules $rules;

    private readonly SpRemoteInverse $inverse;


    public function __construct(?CertificateFiles $files = null)
    {
        $this->catalog = new SchemaCatalog();
        $this->schema = new SchemaValidator(self::SET, $this->catalog);
        $this->rules = new SpRemoteRules(new ExtraRules($this->catalog->options(self::SET)));
        $certificates = new InverseCertificates($files ?? new NoCertificateFiles());
        $this->inverse = new SpRemoteInverse($this->catalog, $certificates);
    }


    public function fromText(string $text, ?string $expectedId): ParsedEntity
    {
        $reading = (new PhpReader())->read($text);
        if ($reading->error !== null) {
            return ParsedEntity::unreadable($reading->error);
        }
        $block = $reading->block ?? throw new \LogicException('A reading holds a block or an error.');
        $header = (new BlockHeader())->read($block, $expectedId);
        $converted = $this->inverse->convert($header->options);
        $document = $this->prepare($converted->document);
        $at = new LineLocator($converted, $block);
        $errors = [...$header->errors, ...$at->unavailable(), ...$converted->errors, ...$this->check($document)];

        return new ParsedEntity(
            $header->entityId,
            $document,
            array_map($at->error(...), $errors),
            array_map($at->notice(...), [...$header->notices, ...$converted->notices]),
        );
    }


    /**
     * @param array<string, mixed> $document
     */
    public function toText(string $entityId, array $document): string
    {
        return PhpExporter::statement($entityId, $this->toCore($document));
    }


    /**
     * @param array<string, mixed> $document
     * @return array<array-key, mixed>
     */
    public function toCore(array $document): array
    {
        return (new SpRemoteTranslator())->translate((new DocumentOrder($this->catalog, self::SET))->order($document));
    }


    /**
     * Every error a stored document has against the schema and the rules of the set.
     *
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function check(array $document): array
    {
        return [...$this->schema->validate($document), ...$this->rules->check($document)];
    }


    public function starterText(): string
    {
        $endpoint = ['Binding' => self::STARTER_BINDING, 'Location' => ''];

        return PhpExporter::value($this->toCore(['AssertionConsumerService' => [$endpoint]]));
    }


    /**
     * @param array<string, mixed> $document
     * @return array<string, mixed>
     */
    private function prepare(array $document): array
    {
        $certificates = array_map(
            static fn (mixed $certificate): array => self::rewritten((array) $certificate),
            array_values((array) ($document['certificates'] ?? [])),
        );
        $certificates === [] || $document['certificates'] = $certificates;

        return (new DocumentOrder($this->catalog, self::SET))->order($document);
    }


    /**
     * @param array<array-key, mixed> $certificate
     * @return array<array-key, mixed>
     */
    private static function rewritten(array $certificate): array
    {
        $pem = $certificate['pem'] ?? null;
        is_string($pem) && $certificate['pem'] = Pem::normalise($pem) ?? $pem;

        return $certificate;
    }
}
