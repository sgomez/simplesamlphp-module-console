<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Routes;

it('finds every API route to walk', function (): void {
    expect(array_keys(Routes::api()))->toContain('console-api-session', 'console-api-entities');
});

it('answers 401 in JSON to every API route without an admin session', function (string $method, string $path): void {
    $response = (new ConsoleClient())->api($method, $path, ['CONTENT_TYPE' => 'application/json'], '{}');

    expect($response->getStatusCode())->toBe(401)
        ->and(Api::json($response))->toBe(['error' => 'unauthenticated']);
})->with(function (): iterable {
    foreach (Routes::api() as $name => [$method, $path]) {
        yield $name => [$method, $path];
    }
});

it('answers 404 for a set the API does not serve', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();

    expect(fn () => $client->api('GET', '/entities/saml20-idp-remote'))->toThrow(SimpleSAML\Error\NotFound::class);
});
