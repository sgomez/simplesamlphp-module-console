<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Application\EntityRepository;
use SimpleSAML\Module\console\Application\ListEntities;
use SimpleSAML\Module\console\Application\Publication\EntityWarnings;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;

final class ListedEntities implements EntityRepository
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $entities
     */
    public function __construct(private readonly array $entities)
    {
    }


    public function find(string $set, string $entityId): ?StoredEntity
    {
        return null;
    }


    public function all(string $set): array
    {
        return array_values(array_filter($this->entities, static fn (StoredEntity $e): bool => $e->set === $set));
    }


    public function create(string $set, string $entityId, array $document, string $identity): void
    {
    }


    public function update(string $set, string $entityId, int $version, array $document, string $identity): int
    {
        return $version;
    }


    public function delete(string $set, string $entityId, string $identity): void
    {
    }


    public static function listedPage(StoredEntity ...$entities): ListEntities
    {
        return self::warnedPage([], ...$entities);
    }


    /**
     * A list on which the given entity IDs have one warning each.
     *
     * @param list<string> $warned
     */
    public static function warnedPage(array $warned, StoredEntity ...$entities): ListEntities
    {
        $warnings = new class ($warned) implements EntityWarnings {
            public function __construct(private readonly array $warned)
            {
            }


            public function of(string $set, string $entityId, array $document): array
            {
                return in_array($entityId, $this->warned, true) ? ['careful'] : [];
            }
        };

        return new ListEntities(new ListedEntities(array_values($entities)), $warnings);
    }


    public static function listedSp(string $id, mixed $name = null, bool $enabled = true): StoredEntity
    {
        return new StoredEntity('saml20-sp-remote', $id, $enabled, 1, $name === null ? [] : ['name' => $name]);
    }


    public static function listedIds(array $rows): array
    {
        return array_map(static fn (StoredEntity $e): string => $e->entityId, $rows);
    }
}
