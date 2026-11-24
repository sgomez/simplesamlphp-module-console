<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;

final class ListEntities
{
    public const int PER_PAGE = 25;


    public function __construct(private readonly EntityRepository $repository)
    {
    }


    public function page(string $set, string $query, int $page): EntityPage
    {
        $query = trim($query);
        $matching = array_filter(
            $this->repository->all($set),
            static fn (StoredEntity $entity): bool => stripos($entity->entityId, $query) !== false
                || self::nameMatches($entity, $query),
        );
        $pages = max(1, (int) ceil(count($matching) / self::PER_PAGE));
        $page = min(max($page, 1), $pages);

        return new EntityPage(
            array_slice($matching, ($page - 1) * self::PER_PAGE, self::PER_PAGE),
            count($matching),
            $page,
            $pages,
            $query,
        );
    }


    private static function nameMatches(StoredEntity $entity, string $query): bool
    {
        $names = $entity->document['name'] ?? [];
        foreach (is_array($names) ? $names : [] as $name) {
            if (is_string($name) && stripos($name, $query) !== false) {
                return true;
            }
        }

        return false;
    }
}
