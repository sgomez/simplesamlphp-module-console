<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

final readonly class EntityPage
{
    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $rows
     */
    public function __construct(
        public array $rows,
        public int $total,
        public int $page,
        public int $pages,
        public string $query,
    ) {
    }
}
