<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class SchemaCatalog
{
    public const string BASE_URI = 'https://console.invalid/schemas/';


    public function __construct(private readonly string $directory = __DIR__ . '/../../../docs/spec/schemas')
    {
    }


    public function directory(): string
    {
        return $this->directory;
    }


    public function uri(string $set): string
    {
        return self::BASE_URI . 'entities/' . $set . '.json';
    }


    /**
     * @return array<string, mixed>
     */
    public function schema(string $set): array
    {
        return $this->load($this->directory . '/entities/' . $set . '.json');
    }


    /**
     * @return array<string, mixed>
     */
    public function common(): array
    {
        return $this->load($this->directory . '/common.json');
    }


    /**
     * The options of the set in schema order, `extra` excluded.
     *
     * @return list<string>
     */
    public function options(string $set): array
    {
        $names = array_keys((array) ($this->schema($set)['properties'] ?? []));

        return array_values(array_filter(array_map('strval', $names), static fn (string $n): bool => $n !== 'extra'));
    }


    /**
     * @return array<string, mixed>
     */
    private function load(string $file): array
    {
        $decoded = json_decode((string) file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);

        /** @var array<string, mixed> $schema */
        $schema = is_array($decoded) ? $decoded : [];

        return $schema;
    }
}
