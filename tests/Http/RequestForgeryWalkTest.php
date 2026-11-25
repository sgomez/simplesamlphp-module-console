<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Routes;

it('finds at least one POST route to walk', function (): void {
    expect(Routes::post())->not->toBeEmpty();
});

it('answers 403 to every POST route without a valid token', function (string $path, array $data): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    if (str_starts_with($path, '/api/')) {
        $headers = ['CONTENT_TYPE' => 'application/json'] + $data;
        $response = $client->api('POST', substr($path, 4), $headers, '{}');

        expect($response->getStatusCode())->toBe(403)
            ->and(Api::json($response))->toBe(['error' => 'refused']);

        return;
    }
    $response = $client->post($path, $data);

    expect($response->getStatusCode())->toBe(403)
        ->and(ConsoleClient::body($response))->toContain('Request refused');
})->with(function (): iterable {
    foreach (Routes::post() as $name => [$path]) {
        $forged = str_starts_with($path, '/api/') ? ['HTTP_X_CONSOLE_TOKEN' => 'forged'] : ['_token' => 'forged'];
        yield $name . ' without a token' => [$path, []];
        yield $name . ' with a forged token' => [$path, $forged];
    }
});
