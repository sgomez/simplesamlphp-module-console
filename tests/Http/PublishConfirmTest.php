<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('publishes: stores the Snapshot, redirects to Publish and says Snapshot 1 published', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $response = P::publish($client, $client->page(P::PATH), 'first');
    $after = $client->page(P::PATH);
    $row = $client->database()->query('SELECT * FROM console_snapshot')->fetch();
    $stored = new StoredEntity('saml20-sp-remote', 'https://a.example.org', true, 1, P::VALID);

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(ConsoleClient::BASE . P::PATH)
        ->and($after)->toContain('Snapshot 1 published')
        ->and($after)->toContain('Nothing to publish')
        ->and($row['document'])->toBe(SnapshotDocument::build([$stored]))
        ->and($row['checksum'])->toBe(hash('sha256', $row['document']))
        ->and([$row['number'], $row['format_version'], $row['comment'], $row['created_by']])
            ->toBe([1, 1, 'first', 'admin'])
        ->and($client->page(EntityPages::LIST))->toContain('Up to date')
        ->and($client->page(EntityPages::LIST))->not->toContain('Review ');
});

it('shows Modified for an edited entity and Deleted for one that left no row', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://b.example.org');
    P::publish($client, $client->page(P::PATH));
    (new PdoEntityRepository($client->database(), ''))
        ->update('saml20-sp-remote', 'https://a.example.org', 1, P::VALID + ['name' => ['en' => 'A']], 'admin');
    $client->database()->exec("DELETE FROM console_entity WHERE entity_id = 'https://b.example.org'");

    $html = $client->page(P::PATH);

    expect($html)->toContain('Modified')
        ->and($html)->toContain('Deleted')
        ->and($client->page(EntityPages::LIST))->toContain('Review 2 changes');
});

it('shows the confirmation screen again, writing nothing, when the Pending changes moved', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    $html = $client->page(P::PATH);
    P::seed($client, 'https://b.example.org');

    $response = P::publish($client, $html);
    $again = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(200)
        ->and($again)->toContain('changed since')
        ->and($again)->toContain('https://b.example.org')
        ->and(P::snapshots($client))->toBe(0);
});

it('shows the confirmation screen again, writing nothing, when a problem blocks the request', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    $html = $client->page(P::PATH);
    $client->database()->exec("UPDATE console_entity SET document = '{oops'");

    $response = P::publish($client, $html);

    expect(ConsoleClient::body($response))->toContain('not valid JSON')
        ->and(P::snapshots($client))->toBe(0)
        ->and(EntityPages::count($client, 'console_audit', "action = 'publish'"))->toBe(0);
});

it('records the publish row in the Audit trail', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    P::publish($client, $client->page(P::PATH), 'why');

    $row = $client->database()
        ->query("SELECT identity, snapshot_from, snapshot_to, comment FROM console_audit WHERE action = 'publish'")
        ->fetch();
    expect($row)->toBe(['identity' => 'admin', 'snapshot_from' => null, 'snapshot_to' => 1, 'comment' => 'why']);
});
