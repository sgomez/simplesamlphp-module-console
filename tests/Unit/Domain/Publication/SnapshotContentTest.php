<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Tests\Support\PublicationFixtures as F;

it('lists the entities sorted bytewise, the three sets always present and authsources empty', function (): void {
    $json = SnapshotDocument::build([
        F::entity('https://b.example.org', ['name' => ['en' => 'B']]),
        F::entity('10', ['x' => 1]),
        F::entity('9', ['x' => 2]),
    ]);

    expect($json)->toBe(
        '{"entities":{"saml20-sp-remote":['
        . '{"entityid":"10","document":{"x":1}},{"entityid":"9","document":{"x":2}},'
        . '{"entityid":"https://b.example.org","document":{"name":{"en":"B"}}}],'
        . '"saml20-idp-remote":[],"saml20-idp-hosted":[]},"authsources":[]}',
    );
});

it('holds content only: the same documents give the same bytes whatever their version', function (): void {
    expect(SnapshotDocument::build([F::entity('https://a.example.org', ['x' => 1], 99)]))
        ->toBe(SnapshotDocument::build([F::entity('https://a.example.org', ['x' => 1], 1)]));
});

it('leaves out disabled entities and rows that cannot be loaded', function (): void {
    $json = SnapshotDocument::build([
        new StoredEntity('saml20-sp-remote', 'https://off.example.org', false, 1, ['x' => 1]),
        new StoredEntity('saml20-sp-remote', 'https://bad.example.org', true, 1, null, 'bad'),
    ]);

    expect($json)->toContain('"saml20-sp-remote":[]');
});

it('reads a stored Snapshot back, and nothing from no Snapshot', function (): void {
    $json = SnapshotDocument::build([F::entity('https://a.example.org', ['x' => 1])]);

    expect(SnapshotContent::parse($json)->document('saml20-sp-remote', 'https://a.example.org'))->toBe(['x' => 1])
        ->and(SnapshotContent::parse(null)->entityIds('saml20-sp-remote'))->toBe([]);
});
