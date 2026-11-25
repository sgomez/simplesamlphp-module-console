<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Shell;

it('answers with the shell whatever the state of the database', function (string $state): void {
    $client = match ($state) {
        'unreachable' => (new ConsoleClient())->withUnreachableDatabase(),
        'pending migrations' => (new ConsoleClient())->withDatabase(null),
        'console older' => (new ConsoleClient())->withDatabase([1, 2, 3, 10]),
    };
    $response = $client->loginAsAdmin()->get('/entities/saml20-sp-remote');

    expect($response->getStatusCode())->toBe(200)
        ->and(Shell::token(ConsoleClient::body($response)))->toMatch('/^[0-9a-f]{64}$/');
})->with(['unreachable', 'pending migrations', 'console older']);

it('sends a Twig form post to the shell while the database is not ready', function (): void {
    $client = (new ConsoleClient())->withDatabase(null)->loginAsAdmin();
    $response = $client->post('/entities/saml20-sp-remote/delete', []);

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(ConsoleClient::BASE . '/');
});

it('asks for the admin login before it looks at the database', function (): void {
    $script = escapeshellarg(__DIR__ . '/../Support/visit-without-login.php');
    $output = (string) shell_exec(PHP_BINARY . ' ' . $script . ' unreachable 2>/dev/null');

    expect($output)->toContain('You were redirected to')
        ->and($output)->not->toContain('console-token');
});
