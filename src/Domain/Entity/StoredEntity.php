<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final readonly class StoredEntity
{
    /**
     * @param array<string, mixed>|null $document null when the stored document cannot be loaded
     */
    public function __construct(
        public string $set,
        public string $entityId,
        public bool $enabled,
        public int $version,
        public ?array $document,
        public ?string $loadError = null,
    ) {
    }


    public function name(): ?string
    {
        $name = $this->document['name'] ?? null;
        if (!is_array($name) || $name === []) {
            return null;
        }
        $value = $name['en'] ?? reset($name);

        return is_string($value) ? $value : null;
    }
}
