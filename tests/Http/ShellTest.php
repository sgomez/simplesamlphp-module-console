<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Shell;

it('does not render the shell for a visitor without the admin login', function (): void {
    $script = escapeshellarg(__DIR__ . '/../Support/visit-without-login.php');
    $output = (string) shell_exec(PHP_BINARY . ' ' . $script . ' 2>/dev/null');

    expect($output)->toContain('You were redirected to')
        ->and($output)->toContain('/module.php/core/loginuserpass')
        ->and($output)->not->toContain('console-token');
});

it('answers every screen path with the shell', function (string $path): void {
    $response = (new ConsoleClient())->loginAsAdmin()->get($path);
    $html = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(200)
        ->and($html)->toContain('<html lang="en" dir="ltr">')
        ->and($html)->toContain('<title>Console</title>')
        ->and($html)->toContain('<meta name="robots" content="noindex, nofollow">')
        ->and($html)->toContain('<meta name="viewport" content="width=device-width, initial-scale=1">')
        ->and($html)->toContain('assets/img/favicon.svg')
        ->and($html)->toMatch('~<body>\s*</body>~');
})->with([
    '/',
    '/publish',
    '/entities/saml20-sp-remote',
    '/entities/saml20-sp-remote?q=a&page=2',
    '/entities/saml20-sp-remote/new',
    '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fsp.example.org',
    '/entities/nonsense',
    '/x/y',
]);

it('carries the request-forgery token of the session in a meta element', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $first = Shell::token($client->page());

    expect($first)->toMatch('/^[0-9a-f]{64}$/')->and(Shell::token($client->page('/entities/saml20-sp-remote')))
        ->toBe($first);
});

it('references only the entry script and the stylesheet named by the manifest', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page();
    $manifest = Shell::manifest();
    $base = ConsoleClient::BASE . '/assets/app/';

    expect(Shell::scripts($html))->toBe([$base . $manifest['src/main.tsx']['file']])
        ->and(Shell::stylesheets($html))->toBe([$base . $manifest['src/console.css']['file']])
        ->and($html)->not->toContain('assets/base/')
        ->and($html)->not->toContain('assets/css/');
});

it('references the Vite development server on the same origin when dev_server is set', function (): void {
    $html = (new ConsoleClient())->withModuleConfig(['dev_server' => true])->loginAsAdmin()->page();
    $base = ConsoleClient::BASE . '/assets/app/';

    expect(Shell::scripts($html))->toBe([$base . '@vite/client', $base . 'dev/refresh.ts', $base . 'src/main.tsx'])
        ->and(Shell::stylesheets($html))->toBe([$base . 'src/console.css']);
});

it('leaves the paths under api and assets to their own handlers', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $asset = $client->get('/assets/app/.vite/manifest.json');

    expect($asset->headers->get('Content-Type'))->toBe('application/json')
        ->and(fn () => $client->get('/api/nonsense'))->toThrow(SimpleSAML\Error\NotFound::class);
});

it('passes the default Content Security Policy', function (array $config): void {
    $response = (new ConsoleClient())->withModuleConfig($config)->loginAsAdmin()->get('/');
    $html = ConsoleClient::body($response);

    expect($response->headers->get('Content-Security-Policy'))->toContain("script-src 'self'")
        ->and($html)->not->toMatch('/<script(?![^>]*\ssrc=)[^>]*>/')
        ->and($html)->not->toContain('<style')
        ->and($html)->not->toMatch('/\sstyle\s*=/')
        ->and($html)->not->toMatch('/\son[a-z]+\s*=/')
        ->and($html)->not->toMatch('~(?:src|href|content)="https?://(?!localhost/)~');
})->with(['built files' => [[]], 'development server' => [['dev_server' => true]]]);

it('ships a stylesheet with system font stacks only', function (): void {
    $css = (string) file_get_contents(Shell::BUILD . Shell::manifest()['src/console.css']['file']);

    expect($css)->toContain('system-ui')
        ->and($css)->toContain('ui-monospace')
        ->and($css)->not->toContain('@font-face')
        ->and($css)->not->toContain('url(');
});
