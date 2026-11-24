<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class DocumentOrder
{
    /** @var array<string, mixed> */
    private array $common;


    public function __construct(private readonly SchemaCatalog $catalog, private readonly string $set)
    {
        $this->common = $this->catalog->common();
    }


    /**
     * The document with its objects' keys in the order of the schema; what the schema does not know, `extra`
     * included, keeps its order.
     *
     * @param array<string, mixed> $document
     * @return array<string, mixed>
     */
    public function order(array $document): array
    {
        $ordered = $this->walk($document, $this->catalog->schema($this->set));

        /** @var array<string, mixed> $result */
        $result = is_array($ordered) ? $ordered : [];

        return $result;
    }


    /**
     * @param array<array-key, mixed> $schema
     */
    private function walk(mixed $value, array $schema): mixed
    {
        $schema = $this->resolve($schema);
        if (!is_array($value)) {
            return $value;
        }
        if (array_is_list($value)) {
            $items = (array) ($schema['items'] ?? []);

            return array_map(fn (mixed $item): mixed => $this->walk($item, $items), $value);
        }

        $properties = (array) ($schema['properties'] ?? []);
        $ordered = [];
        foreach ($properties as $name => $property) {
            if (array_key_exists($name, $value)) {
                $ordered[$name] = $this->walk($value[$name], (array) $property);
            }
        }

        return $ordered + $value;
    }


    /**
     * @param array<array-key, mixed> $schema
     * @return array<array-key, mixed>
     */
    private function resolve(array $schema): array
    {
        $guard = 0;
        while (isset($schema['$ref']) && is_string($schema['$ref']) && $guard++ < 10) {
            $pointer = (string) substr($schema['$ref'], (int) strpos($schema['$ref'], '#') + 1);
            $target = $this->common;
            foreach (array_filter(explode('/', $pointer), static fn (string $s): bool => $s !== '') as $step) {
                $target = (array) ($target[$step] ?? []);
            }
            $schema = $target;
        }

        return $schema;
    }
}
