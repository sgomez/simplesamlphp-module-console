<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\BuildFixtures as B;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('builds the new Snapshot on this node within the Publication request', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $response = P::publish($client);
    $dir = $client->snapshotDir();

    expect(Api::json($response))->toBe(['number' => 1, 'build' => null])
        ->and(file_get_contents($dir . '/current'))->toBe('1-1')
        ->and(array_keys(require $dir . '/1-1/saml20-sp-remote.php'))->toBe(['https://a.example.org']);
});

it('keeps the Publication and says the build failed when the Snapshot directory is not writable', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $file = (string) getenv('CONSOLE_TEST_DIR') . '/not-a-directory';
    file_put_contents($file, 'x');
    $client->withModuleConfig(['snapshot_dir' => $file . '/inside']);
    P::seed($client, 'https://a.example.org');

    $body = Api::json(P::publish($client));

    expect($body['number'])->toBe(1)
        ->and($body['build'])->toStartWith('This node could not build it: ')
        ->and(P::snapshots($client))->toBe(1);
});

it('rebuilds on a second Publication, keeping the first build as the previous one', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::publish($client);
    P::seed($client, 'https://b.example.org');

    P::publish($client);

    expect(B::builds($client->snapshotDir()))->toBe(['1-1', '2-1'])
        ->and(file_get_contents($client->snapshotDir() . '/current'))->toBe('2-1');
});

it('counts a deleted, published entity as a Pending change and removes it from the next Snapshot', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://b.example.org');
    P::publish($client);

    P::delete($client, 'https://b.example.org');
    $groups = Api::get($client, P::PATH)['groups'];
    P::publish($client);
    $documents = $client->database()->query('SELECT document FROM console_snapshot ORDER BY number')->fetchAll();

    expect(array_column($groups, 'state'))->toBe(['Deleted'])
        ->and($documents)->toHaveCount(2)
        ->and($documents[1]['document'])->not->toContain('https://b.example.org')
        ->and($documents[1]['document'])->toContain('https://a.example.org');
});

it('does not count the deletion of an entity that was never published', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    P::delete($client, 'https://a.example.org');

    expect(Api::get($client, '/session')['pendingCount'])->toBe(0);
});
