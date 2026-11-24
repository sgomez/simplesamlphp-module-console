<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\Publication\PublicationRefused;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Tests\Support\MemoryPublicationStore;
use SimpleSAML\Module\console\Tests\Support\PublicationFixtures as F;

it('publishes the Snapshot document when the hash is the one the screen carried', function (): void {
    $store = new MemoryPublicationStore([F::entity('https://a.example.org')]);
    $publication = F::service($store);

    $outcome = $publication->publish($publication->review()->hash, 'first', 'admin');

    expect($outcome->number)->toBe(5)
        ->and($store->published)->toBe(SnapshotDocument::build($store->entities));
});

it('answers moved, and writes nothing, when the Pending changes changed since the screen', function (): void {
    $store = new MemoryPublicationStore([F::entity('https://a.example.org')]);
    $publication = F::service($store);
    $hash = $publication->review()->hash;
    $store->entities = [F::entity('https://a.example.org', version: 2)];

    $outcome = $publication->publish($hash, null, 'admin');

    expect($outcome->moved)->toBeTrue()->and($store->published)->toBeNull();
});

it('answers blocked, and writes nothing, when a new problem appeared since the screen', function (): void {
    $store = new MemoryPublicationStore([F::entity('https://a.example.org')]);
    $publication = F::service($store);
    $hash = $publication->review()->hash;
    $store->limit = 1;

    $outcome = $publication->publish($hash, null, 'admin');

    expect($outcome->problems)->not->toBe([])->and($store->published)->toBeNull();
});

it('answers moved when there is nothing left to publish', function (): void {
    $store = new MemoryPublicationStore([]);

    expect(F::service($store)->publish('whatever', null, 'admin')->moved)->toBeTrue();
});

it('turns a refusal of the store into the moved outcome', function (): void {
    $store = new class ([F::entity('https://a.example.org')]) extends MemoryPublicationStore {
        public function publish(Closure $decide, string $identity, ?string $comment): int
        {
            throw PublicationRefused::moved();
        }
    };
    $publication = F::service($store);

    expect($publication->publish($publication->review()->hash, null, 'admin')->moved)->toBeTrue();
});
