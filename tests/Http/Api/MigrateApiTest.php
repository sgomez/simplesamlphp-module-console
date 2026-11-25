<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Db;
use SimpleSAML\Module\console\Tests\Support\Gate;

it('applies the pending migrations and lets the Console through', function (array|null $applied): void {
    $client = (new ConsoleClient())->withDatabase($applied);

    $outcome = Api::migrate($client);

    expect($outcome)->toBe([
        'outcome' => 'Applied',
        'applied' => array_values(array_diff(range(1, 9), $applied ?? [])),
        'failed' => null,
        'reason' => null,
    ])
        ->and(Db::applied($client->database(), 'console_schema_version'))->toBe(range(1, 9))
        ->and(Api::get($client, '/session')['pendingCount'])->toBe(0);
})->with(['fresh install' => [null], 'versions table empty' => [[]]]);

it('records the run under the identity of the administrator', function (): void {
    $client = (new ConsoleClient())->withDatabase(null)->withModuleConfig(['useridattr' => 'uid'])
        ->loginAsAdmin(['uid' => ['alice']]);
    Api::post($client, '/migrate');

    $rows = $client->database()->query('SELECT identity, action, schema_version FROM console_audit');

    expect($rows === false ? null : $rows->fetchAll())
        ->toBe([['identity' => 'alice', 'action' => 'migrate', 'schema_version' => 9]]);
});

it('reports a schema already up to date', function (): void {
    $client = new ConsoleClient();

    $outcome = Api::migrate($client);

    expect($outcome)->toBe(['outcome' => 'Applied', 'applied' => [], 'failed' => null, 'reason' => null])
        ->and(Db::count($client->database(), 'console_schema_version'))->toBe(9);
});

it('reports a run that lost the race to another one', function (): void {
    $client = (new ConsoleClient())->withDatabase(null);
    $client->database()->exec('CREATE TABLE console_entity (id INTEGER)');

    $outcome = Api::migrate($client);

    expect($outcome['outcome'])->toBe('Concurrent')
        ->and($outcome['reason'])->toBe('Another run is applying the migrations at the same time.');
});

it('reports a failed run with the migration and the reason', function (): void {
    $client = (new ConsoleClient())->withDatabase([1, 2, 3, 4]);
    $client->database()->exec('CREATE TABLE console_pointer (other INTEGER NOT NULL)');

    $outcome = Api::migrate($client);

    expect($outcome['outcome'])->toBe('Failed')
        ->and($outcome['applied'])->toBe([])
        ->and($outcome['failed'])->toBe(['number' => 5, 'title' => 'Insert the single row of console_pointer'])
        ->and($outcome['reason'])->toContain('console_pointer has no column named id')
        ->and(Api::refusal($client)['missing'][0]['number'])->toBe(5);
});

it('refuses to run in any state but pending migrations and ready', function (string $state): void {
    $client = $state === 'Unreachable'
        ? (new ConsoleClient())->withUnreachableDatabase()
        : (new ConsoleClient())->withDatabase([1, 2, 3, 10]);

    $response = Api::post($client->loginAsAdmin(), '/migrate');

    expect($response->getStatusCode())->toBe(503)
        ->and(Api::json($response)['state'])->toBe($state);
})->with(['Unreachable', 'ConsoleOlder']);

it('writes nothing for a run without a valid token', function (): void {
    $client = (new ConsoleClient())->withDatabase(null)->loginAsAdmin();

    $response = $client->api('POST', '/migrate', ['CONTENT_TYPE' => 'application/json'], '{}');

    expect($response->getStatusCode())->toBe(403)
        ->and(Db::tableExists($client->database(), 'console_schema_version'))->toBeFalse();
});

it('applies only what is missing when the numbers are not exactly 1 to N', function (): void {
    $client = (new ConsoleClient())->withDatabase(null);
    Api::migrate($client);
    $client->database()->exec('DROP TABLE console_snapshot; DELETE FROM console_schema_version WHERE version = 3');

    expect(Api::migrate($client)['applied'])->toBe([3])
        ->and(Db::applied($client->database(), 'console_schema_version'))->toBe(range(1, 9));
});

it('refuses to run on a SQLite older than the minimum', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    $gate = Gate::withSqlite('3.22.0');

    $response = $gate->guard(Gate::post(['CONTENT_TYPE' => 'application/json']), migrating: true);

    expect($response?->getStatusCode())->toBe(503)
        ->and(Api::json($response)['state'])->toBe('SqliteTooOld');
});
