<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\BuildFixtures as B;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('builds the new Snapshot on this node within the Publication request', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $response = P::publish($client, $client->page(P::PATH));
    $dir = $client->snapshotDir();

    expect($response->getStatusCode())->toBe(302)
        ->and(file_get_contents($dir . '/current'))->toBe('1-1')
        ->and(array_keys(require $dir . '/1-1/saml20-sp-remote.php'))->toBe(['https://a.example.org'])
        ->and($client->page(P::PATH))->toContain('Snapshot 1 published')
        ->and($client->page(P::PATH))->not->toContain('could not build');
});

it('keeps the Publication and says the build failed when the Snapshot directory is not writable', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $file = (string) getenv('CONSOLE_TEST_DIR') . '/not-a-directory';
    file_put_contents($file, 'x');
    $client->withModuleConfig(['snapshot_dir' => $file . '/inside']);
    P::seed($client, 'https://a.example.org');

    $response = P::publish($client, $client->page(P::PATH));
    $after = $client->page(P::PATH);

    expect($response->getStatusCode())->toBe(302)
        ->and(P::snapshots($client))->toBe(1)
        ->and($after)->toContain('Snapshot 1 published')
        ->and($after)->toContain('could not build');
});

it('rebuilds on a second Publication, keeping the first build as the previous one', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::publish($client, $client->page(P::PATH));
    P::seed($client, 'https://b.example.org');

    P::publish($client, $client->page(P::PATH));

    expect(B::builds($client->snapshotDir()))->toBe(['1-1', '2-1'])
        ->and(file_get_contents($client->snapshotDir() . '/current'))->toBe('2-1');
});
