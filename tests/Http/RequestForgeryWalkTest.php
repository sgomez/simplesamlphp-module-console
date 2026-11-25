<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Routes;

it('answers 403 to every form POST route without a valid token', function (string $path, array $data): void {
    $response = (new ConsoleClient())->loginAsAdmin()->post($path, $data);

    expect($response->getStatusCode())->toBe(403)
        ->and(ConsoleClient::body($response))->toContain('Request refused');
})->with(function (): iterable {
    foreach (Routes::post() as $name => [$path]) {
        yield $name . ' without a token' => [$path, []];
        yield $name . ' with a forged token' => [$path, ['_token' => 'forged']];
    }
});
