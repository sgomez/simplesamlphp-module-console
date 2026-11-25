<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

use Opis\JsonSchema\Errors\ErrorFormatter;
use Opis\JsonSchema\Errors\ValidationError as OpisError;
use Opis\JsonSchema\JsonPointer;
use Opis\JsonSchema\Parsers\SchemaParser;
use Opis\JsonSchema\Resolvers\SchemaResolver;
use Opis\JsonSchema\SchemaLoader;
use Opis\JsonSchema\Validator;

final class SchemaValidator
{
    private const int MAX_ERRORS = 1000;


    private readonly SchemaCatalog $catalog;

    /** @var array<string, \Opis\JsonSchema\Validator> parsing the schemas is slow, so each set is parsed once per process */
    private static array $validators = [];

    private readonly Validator $validator;


    public function __construct(private readonly string $set, ?SchemaCatalog $catalog = null)
    {
        $this->catalog = $catalog ?? new SchemaCatalog();
        $key = $this->catalog->directory() . '|' . $set;
        self::$validators[$key] ??= $this->build();
        $this->validator = self::$validators[$key];
    }


    private function build(): Validator
    {
        $resolver = new SchemaResolver();
        $resolver->registerRaw($this->raw($this->catalog->common()), SchemaCatalog::BASE_URI . 'common.json');
        $resolver->registerRaw($this->raw($this->catalog->schema($this->set)), $this->catalog->uri($this->set));
        $loader = new SchemaLoader(new SchemaParser([], ['allowDefaults' => false]), $resolver, true);

        return new Validator($loader, self::MAX_ERRORS, false);
    }


    /**
     * @param array<array-key, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function validate(array $document): array
    {
        $data = json_decode(json_encode($document, JSON_THROW_ON_ERROR), false, 512, JSON_THROW_ON_ERROR);
        $uri = $this->catalog->uri($this->set);
        $error = $this->validator->validate($data, $uri)->error();
        // PHP cannot tell [] from {}: an empty array where the schema wants an object is the empty object.
        while ($error !== null && ($path = EmptyObjects::path($error, $data)) !== null) {
            $data = EmptyObjects::set($data, $path);
            $error = $this->validator->validate($data, $uri)->error();
        }

        return $error === null ? [] : $this->flatten($error);
    }


    /**
     * @param array<string, mixed> $schema
     */
    private function raw(array $schema): string
    {
        return json_encode(SchemaSplitter::split($schema), JSON_THROW_ON_ERROR);
    }


    /**
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function flatten(OpisError $error): array
    {
        $formatter = new ErrorFormatter();
        /** @var array<string, list<string>> $messages */
        $messages = $formatter->format(
            $error,
            true,
            static fn (OpisError $e, ?string $message): string => $formatter->formatErrorMessage($e, $message),
            static fn (OpisError $e): string => JsonPointer::pathToString($e->data()->fullPath()),
        );
        $errors = [];
        foreach ($messages as $pointer => $list) {
            foreach (array_unique($list) as $message) {
                $errors[] = new ValidationError($pointer === '/' ? '' : rawurldecode((string) $pointer), $message);
            }
        }

        return $errors;
    }
}
