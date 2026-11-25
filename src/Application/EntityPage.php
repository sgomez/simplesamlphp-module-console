<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

final readonly class EntityPage
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $rows
     * @param array<string, int> $counts the rows the search matches under each filter, by filter value
     */
    public function __construct(
        public array $rows,
        public int $total,
        public int $page,
        public int $pages,
        public string $query,
        public ListFilter $filter,
        public array $counts,
    ) {
    }
}
