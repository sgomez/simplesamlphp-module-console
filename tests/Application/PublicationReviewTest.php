<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\Publication\EntityWarnings;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Tests\Support\MemoryPublicationStore;
use SimpleSAML\Module\console\Tests\Support\PublicationFixtures as F;

it('offers the next number and the Pending changes of a valid set', function (): void {
    $review = F::service(new MemoryPublicationStore([F::entity('https://a.example.org')]))->review();

    expect($review->canPublish())->toBeTrue()
        ->and($review->nextNumber)->toBe(5)
        ->and($review->changes)->toHaveCount(1)
        ->and($review->problems)->toBe([]);
});

it('does not offer a Publication without Pending changes', function (): void {
    $current = SnapshotDocument::build([F::entity('https://a.example.org')]);
    $review = F::service(new MemoryPublicationStore([F::entity('https://a.example.org')], $current))->review();

    expect($review->changes)->toBe([])->and($review->canPublish())->toBeFalse();
});

it('blocks on a document the schema rejects, naming the entity, even without a Pending change', function (): void {
    $bad = ['AssertionConsumerService' => [['Binding' => 'urn:a:b']]];
    $current = SnapshotDocument::build([F::entity('https://old.example.org', $bad)]);
    $entities = [F::entity('https://old.example.org', $bad), F::entity('https://new.example.org')];

    $review = F::service(new MemoryPublicationStore($entities, $current))->review();

    expect($review->canPublish())->toBeFalse()
        ->and($review->problems)->not->toBe([])
        ->and($review->problems[0]->entityId)->toBe('https://old.example.org');
});

it('blocks on an Unreadable row, with its load error', function (): void {
    $store = new MemoryPublicationStore([F::entity('https://bad.example.org', error: 'not valid JSON')]);

    $review = F::service($store)->review();

    expect($review->canPublish())->toBeFalse()
        ->and($review->problems[0]->entityId)->toBe('https://bad.example.org')
        ->and($review->problems[0]->message)->toContain('not valid JSON');
});

it('blocks on a processing filter class that does not resolve', function (): void {
    $filter = ['priority' => 10, 'filter' => ['class' => 'nope:Missing']];
    $document = F::entity('x')->document + ['authproc' => [$filter]];
    $store = new MemoryPublicationStore([F::entity('https://a.example.org', $document)]);

    $blocked = F::service($store, resolves: false)->review();
    $open = F::service($store, resolves: true)->review();

    expect($blocked->problems[0]->message)->toContain('nope:Missing')
        ->and($open->problems)->toBe([]);
});

it('blocks when the Snapshot is larger than the limit minus 1 MiB, naming max_allowed_packet', function (): void {
    $store = new MemoryPublicationStore([F::entity('https://a.example.org')]);
    $store->limit = 1024 * 1024 + 10;

    expect(F::service($store)->review()->problems[0]->message)->toContain('max_allowed_packet');
});

it('collects the warnings of the entities with Pending changes only', function (): void {
    $current = SnapshotDocument::build([F::entity('https://same.example.org')]);
    $store = new MemoryPublicationStore(
        [F::entity('https://same.example.org'), F::entity('https://new.example.org')],
        $current,
    );
    $warnings = new class implements EntityWarnings {
        public function of(string $set, string $entityId, array $document): array
        {
            return ['careful with ' . $entityId];
        }
    };

    $review = F::service($store, warnings: $warnings)->review();

    expect($review->warnings)->toHaveCount(1)
        ->and($review->warnings[0]->message)->toBe('careful with https://new.example.org');
});
