<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Gate;

it('answers 401 in JSON without an admin session, never a redirect', function (): void {
    $response = (new ConsoleClient())->api('GET', '/session');

    expect($response->getStatusCode())->toBe(401)
        ->and(Api::json($response))->toBe(['error' => 'unauthenticated']);
});

it('answers 503 with the state when the database is not ready', function (): void {
    $response = (new ConsoleClient())->withDatabase(null)->loginAsAdmin()->api('GET', '/session');

    expect($response->getStatusCode())->toBe(503)
        ->and(Api::json($response)['state'])->toBe('MigrationsPending');
});

it('checks the admin session before the database', function (): void {
    $response = (new ConsoleClient())->withUnreachableDatabase()->api('GET', '/session');

    expect($response->getStatusCode())->toBe(401);
});

it('lets a POST with the token and a JSON body through', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    [$gate, $token] = Gate::withToken();

    expect($gate->guard(Gate::post(['HTTP_X_CONSOLE_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'])))
        ->toBeNull();
});

it('answers 403 to a POST without a valid token', function (array $headers): void {
    (new ConsoleClient())->loginAsAdmin();
    [$gate] = Gate::withToken();

    $response = $gate->guard(Gate::post($headers + ['CONTENT_TYPE' => 'application/json']));

    expect($response?->getStatusCode())->toBe(403);
})->with([
    'without a token' => [[]],
    'with a forged token' => [['HTTP_X_CONSOLE_TOKEN' => 'forged']],
]);

it('answers 415 to a POST with a valid token and a body that is not JSON', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    [$gate, $token] = Gate::withToken();

    $response = $gate->guard(Gate::post(
        ['HTTP_X_CONSOLE_TOKEN' => $token, 'CONTENT_TYPE' => 'application/x-www-form-urlencoded'],
        'a=b',
    ));

    expect($response?->getStatusCode())->toBe(415);
});

it('refuses a POST without a token before it looks at the content type', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    [$gate] = Gate::withToken();

    expect($gate->guard(Gate::post(['CONTENT_TYPE' => 'text/plain']))?->getStatusCode())->toBe(403);
});
