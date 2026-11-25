<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Gate;
use SimpleSAML\Module\console\Tests\Support\Routes;

it('finds the API POST routes to walk', function (): void {
    expect(array_keys(Routes::apiPost()))
        ->toContain('console-api-entity-save')
        ->toContain('console-api-entity-validate')
        ->toContain('console-api-entity-delete')
        ->toContain('console-api-migrate');
});

it('answers 403 to every API POST route without a valid token', function (string $path, array $server): void {
    $response = (new ConsoleClient())->loginAsAdmin()->api('POST', $path, $server + [
        'CONTENT_TYPE' => 'application/json',
    ], '{}');

    expect($response->getStatusCode())->toBe(403);
})->with(function (): iterable {
    foreach (Routes::apiPost() as $name => [$path]) {
        yield $name . ' without a token' => [$path, []];
        yield $name . ' with a forged token' => [$path, ['HTTP_X_CONSOLE_TOKEN' => 'forged']];
    }
});

it('answers 415 to every API POST route with a valid token and a body that is not JSON', function (string $path): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    [, $token] = Gate::withToken();

    $response = $client->api('POST', $path, [
        'HTTP_X_CONSOLE_TOKEN' => $token,
        'CONTENT_TYPE' => 'application/x-www-form-urlencoded',
    ], 'a=b');

    expect($response->getStatusCode())->toBe(415);
})->with(fn (): array => Routes::apiPost());
