<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Publication\EntityState;
use SimpleSAML\Module\console\Domain\Publication\PendingChanges;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Tests\Support\PublicationFixtures as F;

it('computes the five states against the current Snapshot', function (): void {
    $published = SnapshotDocument::build([
        F::entity('https://same.example.org'),
        F::entity('https://changed.example.org'),
        F::entity('https://gone.example.org'),
        F::entity('https://broken.example.org'),
    ]);
    $saved = [
        F::entity('https://same.example.org'),
        F::entity('https://changed.example.org', ['name' => ['en' => 'B']]),
        F::entity('https://new.example.org'),
        F::entity('https://broken.example.org', error: 'bad'),
    ];

    expect(F::states($saved, $published))->toBe([
        'https://broken.example.org' => EntityState::Unreadable,
        'https://changed.example.org' => EntityState::Modified,
        'https://gone.example.org' => EntityState::Deleted,
        'https://new.example.org' => EntityState::Unpublished,
        'https://same.example.org' => EntityState::UpToDate,
    ]);
});

it('treats every entity as Unpublished before the first Publication', function (): void {
    expect(F::states([F::entity('https://a.example.org')], null))
        ->toBe(['https://a.example.org' => EntityState::Unpublished]);
});

it('does not count an Up to date entity as a Pending change', function (): void {
    $published = SnapshotDocument::build([F::entity('https://a.example.org')]);
    $changes = PendingChanges::compute([F::entity('https://a.example.org')], SnapshotContent::parse($published));

    expect(PendingChanges::pending($changes))->toBe([]);
});

it('hashes the keys and versions of the Pending changes, whatever the order they come in', function (): void {
    $none = SnapshotContent::parse(null);
    $a = PendingChanges::compute([F::entity('https://a.example.org'), F::entity('https://b.example.org')], $none);
    $b = PendingChanges::compute([F::entity('https://b.example.org'), F::entity('https://a.example.org')], $none);
    $edited = PendingChanges::compute(
        [F::entity('https://a.example.org', version: 2), F::entity('https://b.example.org')],
        $none,
    );

    expect(PendingChanges::hash($a))->toBe(PendingChanges::hash($b))
        ->and(PendingChanges::hash($a))->not->toBe(PendingChanges::hash($edited));
});
