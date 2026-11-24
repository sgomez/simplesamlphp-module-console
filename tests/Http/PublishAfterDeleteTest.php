<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

function deleteSp(ConsoleClient $client, string $entityId): void
{
    $client->post('/entities/saml20-sp-remote/delete', [
        '_token' => EntityPages::field($client->page(EntityPages::LIST), '_token'),
        'entityid' => $entityId,
    ]);
}

it('counts a deleted, published entity as a Pending change and removes it from the next Snapshot', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://b.example.org');
    P::publish($client, $client->page(P::PATH));

    deleteSp($client, 'https://b.example.org');
    $screen = $client->page(P::PATH);
    P::publish($client, $screen);
    $documents = $client->database()->query('SELECT document FROM console_snapshot ORDER BY number')->fetchAll();

    expect($screen)->toContain('Deleted')
        ->and($documents)->toHaveCount(2)
        ->and($documents[1]['document'])->not->toContain('https://b.example.org')
        ->and($documents[1]['document'])->toContain('https://a.example.org');
});

it('does not count the deletion of an entity that was never published', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    deleteSp($client, 'https://a.example.org');

    expect($client->page(EntityPages::LIST))->not->toContain('Review ');
});
