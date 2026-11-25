<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

use SimpleSAML\Module\console\Application\Publication\EntityWarnings;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\EntityState;

final class ListEntities
{
    public const int PER_PAGE = 12;


    public function __construct(
        private readonly EntityRepository $repository,
        private readonly EntityWarnings $warnings,
    ) {
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $states
     */
    public function page(
        string $set,
        string $query,
        int $page,
        ListFilter $filter = ListFilter::All,
        array $states = [],
    ): EntityPage {
        $query = trim($query);
        $matching = array_filter(
            $this->repository->all($set),
            static fn (StoredEntity $entity): bool => stripos($entity->entityId, $query) !== false
                || self::nameMatches($entity, $query),
        );
        $unpublished = [];
        foreach ($states as $change) {
            $change->state === EntityState::Unpublished && $unpublished[] = $change->set . "\0" . $change->entityId;
        }
        $by = [];
        foreach (ListFilter::cases() as $case) {
            $by[$case->value] = array_filter(
                $matching,
                fn (StoredEntity $entity): bool => $this->passes($case, $entity, $unpublished),
            );
        }

        return self::slice($by[$filter->value], $page, $query, $filter, array_map(count(...), $by));
    }


    /**
     * @param array<int, \SimpleSAML\Module\console\Domain\Entity\StoredEntity> $rows
     * @param array<string, int> $counts
     */
    private static function slice(array $rows, int $page, string $query, ListFilter $filter, array $counts): EntityPage
    {
        usort($rows, static fn (StoredEntity $a, StoredEntity $b): int => strcmp(self::sortKey($a), self::sortKey($b))
            ?: strcmp($a->entityId, $b->entityId));
        $pages = max(1, (int) ceil(count($rows) / self::PER_PAGE));
        $page = min(max($page, 1), $pages);

        return new EntityPage(
            array_slice($rows, ($page - 1) * self::PER_PAGE, self::PER_PAGE),
            count($rows),
            $page,
            $pages,
            $query,
            $filter,
            $counts,
        );
    }


    /**
     * Not live: Unpublished, or disabled, which is Not live or To be withdrawn (section 10.8).
     *
     * @param list<string> $unpublished
     */
    private function passes(ListFilter $filter, StoredEntity $entity, array $unpublished): bool
    {
        return match ($filter) {
            ListFilter::All => true,
            ListFilter::NotLive => !$entity->enabled
                || in_array($entity->set . "\0" . $entity->entityId, $unpublished, true),
            ListFilter::WithWarnings => $entity->document !== null
                && $this->warnings->of($entity->set, $entity->entityId, $entity->document) !== [],
        };
    }


    private static function sortKey(StoredEntity $entity): string
    {
        return mb_strtolower($entity->name() ?? $entity->entityId);
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
