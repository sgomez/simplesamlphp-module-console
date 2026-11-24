<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Application\Publication\EntityWarnings;
use SimpleSAML\Module\console\Application\Publication\NoEntityWarnings;
use SimpleSAML\Module\console\Application\Publication\ProcessingFilterClasses;
use SimpleSAML\Module\console\Application\Publication\Publication;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\PendingChanges;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;

final class PublicationFixtures
{
    public static function service(
        MemoryPublicationStore $store,
        bool $resolves = true,
        ?EntityWarnings $warnings = null,
    ): Publication {
        $filters = new class ($resolves) implements ProcessingFilterClasses {
            public function __construct(private readonly bool $resolves)
            {
            }


            public function resolves(string $class): bool
            {
                return $this->resolves;
            }
        };

        return new Publication($store, new SpRemote(), $filters, $warnings ?? new NoEntityWarnings());
    }


    /**
     * @param array<string, mixed>|null $document
     */
    public static function entity(
        string $id,
        ?array $document = null,
        int $version = 1,
        ?string $error = null,
    ): StoredEntity {
        return new StoredEntity(
            'saml20-sp-remote',
            $id,
            true,
            $version,
            $error === null ? ($document ?? PublishFixtures::VALID) : null,
            $error,
        );
    }


    /**
     * The state of each entity ID against the given Snapshot bytes.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\StoredEntity> $saved
     * @return array<string, \SimpleSAML\Module\console\Domain\Publication\EntityState>
     */
    public static function states(array $saved, ?string $snapshot): array
    {
        $states = [];
        foreach (PendingChanges::compute($saved, SnapshotContent::parse($snapshot)) as $change) {
            $states[$change->entityId] = $change->state;
        }

        return $states;
    }
}
