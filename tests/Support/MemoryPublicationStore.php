<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Application\Publication\PublicationInput;
use SimpleSAML\Module\console\Application\Publication\PublicationStore;

class MemoryPublicationStore implements PublicationStore
{
    public ?string $published = null;

    public ?int $limit = null;


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $entities
     */
    public function __construct(public array $entities, public ?string $current = null)
    {
    }


    public function read(): PublicationInput
    {
        return new PublicationInput($this->entities, $this->current === null ? null : 4, 4, $this->current, 'x');
    }


    public function documentLimit(): ?int
    {
        return $this->limit;
    }


    public function publish(\Closure $decide, string $identity, ?string $comment): int
    {
        $this->published = $decide($this->read());

        return 5;
    }
}
