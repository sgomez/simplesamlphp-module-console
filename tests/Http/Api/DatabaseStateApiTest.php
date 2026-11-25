<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Infrastructure\Persistence\DatabaseReading;
use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Gate;

it('answers every API route with 503 while the database is not ready', function (string $path): void {
    $body = Api::refusal((new ConsoleClient())->withUnreachableDatabase()->loginAsAdmin(), $path);

    expect($body['state'])->toBe('Unreachable');
})->with(['/session', '/entities/saml20-sp-remote']);

it('carries the identity, logout and the links to core, but no count', function (): void {
    $body = Api::refusal((new ConsoleClient())->withModuleConfig(['useridattr' => 'uid'])->withDatabase(null)
        ->loginAsAdmin(['uid' => ['alice']]));

    expect($body['session']['identity'])->toBe('alice')
        ->and($body['session']['core']['federation'])->toBe('http://localhost/simplesaml/module.php/admin/federation')
        ->and($body['session']['logoutUrl'])->toContain('/module.php/core/logout/admin')
        ->and($body['session'])->not->toHaveKey('pendingCount');
});

it('answers Database unreachable with the driver message as technical detail', function (): void {
    $body = Api::refusal((new ConsoleClient())->withUnreachableDatabase()->loginAsAdmin());

    expect($body['state'])->toBe('Unreachable')
        ->and($body['detail'])->toContain('unable to open database file');
});

it('lists every migration with its statement on a fresh install', function (): void {
    $body = Api::refusal((new ConsoleClient())->withDatabase(null)->loginAsAdmin());

    expect($body['state'])->toBe('MigrationsPending')
        ->and($body['known'])->toBe(9)
        ->and($body['highest'])->toBe(0)
        ->and($body['detail'])->toBeNull()
        ->and($body['missing'])->toBe([
            ['number' => 1, 'title' => 'Create console_entity'],
            ['number' => 2, 'title' => 'Create console_authsource'],
            ['number' => 3, 'title' => 'Create console_snapshot'],
            ['number' => 4, 'title' => 'Create console_pointer'],
            ['number' => 5, 'title' => 'Insert the single row of console_pointer'],
            ['number' => 6, 'title' => 'Create console_node'],
            ['number' => 7, 'title' => 'Create console_audit'],
            ['number' => 8, 'title' => 'Create the index console_audit_entity'],
            ['number' => 9, 'title' => 'Create the index console_audit_authsource'],
        ]);
});

it('lists only the missing migrations when the numbers are not exactly 1 to N', function (): void {
    $body = Api::refusal((new ConsoleClient())->withDatabase([1, 2, 4, 5, 6, 7, 8, 9])->loginAsAdmin());

    expect($body['state'])->toBe('MigrationsPending')
        ->and($body['missing'])->toBe([['number' => 3, 'title' => 'Create console_snapshot']]);
});

it('answers Console older than the database with both schema versions', function (array $applied): void {
    $body = Api::refusal((new ConsoleClient())->withDatabase($applied)->loginAsAdmin());

    expect($body['state'])->toBe('ConsoleOlder')
        ->and($body['known'])->toBe(9)
        ->and($body['highest'])->toBe(max($applied))
        ->and($body['missing'])->toBe([]);
})->with(['newer' => [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]], 'newer with gaps' => [[1, 12]]]);

it('answers SQLite too old with the version found and the minimum', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    [$gate] = Gate::withToken();

    $response = $gate->refusal(new DatabaseReading(DatabaseStatus::sqliteTooOld('3.22.0')));
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(503)
        ->and($body['state'])->toBe('SqliteTooOld')
        ->and($body['sqliteVersion'])->toBe('3.22.0')
        ->and($body['sqliteMinimum'])->toBe('3.24.0');
});
