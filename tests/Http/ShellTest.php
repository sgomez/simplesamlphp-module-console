<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Redirects;

it('does not render the shell for a visitor without the admin login', function (): void {
    $script = escapeshellarg(__DIR__ . '/../Support/visit-without-login.php');
    $output = (string) shell_exec(PHP_BINARY . ' ' . $script . ' 2>/dev/null');

    expect($output)->toContain('You were redirected to')
        ->and($output)->toContain('/module.php/core/loginuserpass')
        ->and($output)->not->toContain('data-identity');
});

it('renders the shell for an administrator', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $response = Redirects::follow($client, $client->get('/'));
    $html = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(200)
        ->and($html)->toContain('<html lang="en" dir="ltr">')
        ->and($html)->toContain('name="robots"')
        ->and($html)->toContain('name="viewport"')
        ->and($html)->not->toContain('assets/base/');
});

it('loads only the module stylesheet and script', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page();

    preg_match_all('/<link[^>]+rel="stylesheet"[^>]*>/', $html, $styles);
    preg_match_all('/<script[^>]*>/', $html, $scripts);

    expect($styles[0])->toHaveCount(1)
        ->and($styles[0][0])->toContain('assets/css/console.css')
        ->and($scripts[0])->toHaveCount(1)
        ->and($scripts[0][0])->toContain('assets/js/console.js');
});

it('uses system font stacks only', function (): void {
    $css = (string) file_get_contents(dirname(__DIR__, 2) . '/public/assets/css/console.css');

    expect($css)->toContain('system-ui')
        ->and($css)->toContain('ui-monospace')
        ->and($css)->not->toContain('@font-face')
        ->and($css)->not->toContain('url(http');
});

it('has the two fixed links to core at the foot of the sidebar', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page();

    expect($html)->toContain('href="http://localhost/simplesaml/module.php/admin/"')
        ->and($html)->toContain('/module.php/core/logout/admin');
});

it('shows the constant admin identity when useridattr is unset', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin(['uid' => ['alice']])->page();

    expect($html)->toContain('data-identity>admin<');
});

it('shows the first value of useridattr', function (): void {
    $client = (new ConsoleClient())
        ->withModuleConfig(['useridattr' => 'uid'])
        ->loginAsAdmin(['uid' => ['alice', 'bob']]);

    expect($client->page())->toContain('data-identity>alice<');
});

it('falls back to admin when the useridattr attribute is missing or empty', function (array $attributes): void {
    $client = (new ConsoleClient())
        ->withModuleConfig(['useridattr' => 'uid'])
        ->loginAsAdmin($attributes);

    expect($client->page())->toContain('data-identity>admin<');
})->with([
    'missing' => [[]],
    'empty' => [['uid' => []]],
    'blank' => [['uid' => ['']]],
]);

it('passes the default Content Security Policy', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $response = Redirects::follow($client, $client->get('/'));
    $html = ConsoleClient::body($response);

    expect($response->headers->get('Content-Security-Policy'))->toContain("script-src 'self'")
        ->and($html)->not->toMatch('/<script(?![^>]*\ssrc=)[^>]*>/')
        ->and($html)->not->toContain('<style')
        ->and($html)->not->toMatch('/\sstyle\s*=/')
        ->and($html)->not->toMatch('/\son[a-z]+\s*=/')
        ->and($html)->not->toMatch('~(?:src|href)="https?://(?!localhost/)~');
});
