<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\Publication\EntityWarnings;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Tests\Support\MemoryPublicationStore;
use SimpleSAML\Module\console\Tests\Support\PublicationFixtures as F;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('names each Pending change, a Deleted one from the current Snapshot, an unnamed one null', function (): void {
    $current = SnapshotDocument::build([
        F::entity('https://gone.example.org', P::VALID + ['name' => ['en' => 'Gone']]),
        F::entity('https://renamed.example.org', P::VALID + ['name' => ['en' => 'Old']]),
        F::entity('https://unnamed.example.org', P::VALID + ['name' => ['en' => 'Was named']]),
    ]);
    $store = new MemoryPublicationStore([
        F::entity('https://new.example.org', P::VALID + ['name' => ['es' => 'Nuevo']]),
        F::entity('https://renamed.example.org', P::VALID + ['name' => ['en' => 'New']]),
        F::entity('https://unnamed.example.org'),
        F::entity('https://bad.example.org', error: 'not valid JSON'),
    ], $current);

    $review = F::service($store)->review();
    $names = [];
    foreach ($review->changes as $change) {
        $names[$change->entityId] = $review->name($change);
    }

    expect($names)->toBe([
        'https://bad.example.org' => null,
        'https://gone.example.org' => 'Gone',
        'https://new.example.org' => 'Nuevo',
        'https://renamed.example.org' => 'New',
        'https://unnamed.example.org' => null,
    ]);
});

it('names a Deleted change null when the Snapshot document has no name', function (): void {
    $current = SnapshotDocument::build([F::entity('https://gone.example.org')]);

    $review = F::service(new MemoryPublicationStore([], $current))->review();

    expect($review->name($review->changes[0]))->toBeNull();
});

it('names the object of each problem and warning, null when it has no name', function (): void {
    $bad = ['AssertionConsumerService' => [['Binding' => 'urn:a:b']]];
    $store = new MemoryPublicationStore([
        F::entity('https://a.example.org', $bad + ['name' => ['en' => 'Alpha']]),
        F::entity('https://b.example.org', $bad),
        F::entity('https://0.example.org', error: 'not valid JSON'),
    ]);
    $warnings = new class implements EntityWarnings {
        public function of(string $set, string $entityId, array $document): array
        {
            return ['careful'];
        }
    };

    $review = F::service($store, warnings: $warnings)->review();

    expect(array_unique(array_map(static fn ($p): ?string => $p->name, $review->problems)))->toBe(['Alpha', null])
        ->and(array_map(static fn ($p): array => [$p->entityId, $p->name], $review->warnings))->toBe([
            ['https://a.example.org', 'Alpha'],
            ['https://b.example.org', null],
        ]);
});
