<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('publishes: stores the Snapshot and answers its number', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $response = P::publish($client, null, 'first');
    $row = $client->database()->query('SELECT * FROM console_snapshot')->fetch();
    $stored = new StoredEntity('saml20-sp-remote', 'https://a.example.org', true, 1, P::VALID);
    $after = Api::get($client, P::PATH);

    expect($response->getStatusCode())->toBe(200)
        ->and(Api::json($response))->toBe(['number' => 1, 'build' => null])
        ->and($row['document'])->toBe(SnapshotDocument::build([$stored]))
        ->and($row['checksum'])->toBe(hash('sha256', $row['document']))
        ->and([$row['number'], $row['format_version'], $row['comment'], $row['created_by']])
            ->toBe([1, 1, 'first', 'admin'])
        ->and($after['groups'])->toBe([])
        ->and($after['current'])->toBe(['number' => 1, 'createdAt' => $row['created_at']])
        ->and($after['nextNumber'])->toBe(2)
        ->and(Api::get($client, EntityPages::LIST)['rows'][0]['state'])->toBe('Up to date')
        ->and(Api::get($client, '/session')['pendingCount'])->toBe(0);
});

it('answers 409 with the current review, writing nothing, when the Pending changes moved', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    $hash = P::hash($client);
    P::seed($client, 'https://b.example.org');

    $response = P::publish($client, $hash);
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(409)
        ->and($body['code'])->toBe('moved')
        ->and(array_column($body['review']['groups'][0]['changes'], 'entityId'))
            ->toBe(['https://a.example.org', 'https://b.example.org'])
        ->and($body['review']['hash'])->toBe(P::hash($client))
        ->and(P::snapshots($client))->toBe(0);
});

it('answers 409 with the problems, writing nothing, when a new problem blocks the request', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    $client->database()->exec("UPDATE console_entity SET document = '{oops'");
    $hash = P::hash($client);

    $response = P::publish($client, $hash);
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(409)
        ->and($body['code'])->toBe('blocked')
        ->and($body['problems'][0]['entityId'])->toBe('https://a.example.org')
        ->and($body['problems'][0]['message'])->toContain('not valid JSON')
        ->and($body['review']['problems'])->toBe($body['problems'])
        ->and(P::snapshots($client))->toBe(0)
        ->and(EntityPages::count($client, 'console_audit', "action = 'publish'"))->toBe(0);
});

it('treats a body without a string hash as moved', function (string $body): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $response = P::send($client, $body);

    expect($response->getStatusCode())->toBe(409)->and(P::snapshots($client))->toBe(0);
})->with(['{"hash": 1}', '[]', '"x"', '{oops']);

it('records the publish row in the Audit trail, without a comment when it is not a string', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::publish($client, null, 'why');
    P::seed($client, 'https://b.example.org');
    P::send($client, (string) json_encode(['hash' => P::hash($client), 'comment' => ['x']]));

    $rows = $client->database()
        ->query("SELECT identity, snapshot_from, snapshot_to, comment FROM console_audit WHERE action = 'publish'")
        ->fetchAll(PDO::FETCH_ASSOC);

    expect($rows)->toBe([
        ['identity' => 'admin', 'snapshot_from' => null, 'snapshot_to' => 1, 'comment' => 'why'],
        ['identity' => 'admin', 'snapshot_from' => 1, 'snapshot_to' => 2, 'comment' => null],
    ]);
});

it('refuses a confirming request without the token, writing nothing', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    $hash = (string) json_encode(['hash' => P::hash($client)]);

    expect($client->api('POST', P::PATH, ['CONTENT_TYPE' => 'application/json'], $hash)->getStatusCode())->toBe(403)
        ->and(P::snapshots($client))->toBe(0);
});
