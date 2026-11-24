<?php

declare(strict_types=1);

use SimpleSAML\Configuration;
use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Domain\MigrationReport;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\StatePages;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Db;
use SimpleSAML\Session;

it('offers a button with the request-forgery token on the pending migrations page', function (): void {
    $html = (new ConsoleClient())->withDatabase(null)->loginAsAdmin()->page();

    expect($html)->toContain('<form method="post" action="http://localhost/simplesaml/module.php/console/migrate">')
        ->and($html)->toContain('type="submit"')
        ->and(ConsoleClient::tokenIn($html))->toMatch('/^[0-9a-f]{64}$/');
});

it('applies the migrations, redirects and shows a one-shot message', function (): void {
    $client = (new ConsoleClient())->withDatabase(null)->loginAsAdmin();
    $token = ConsoleClient::tokenIn($client->page());

    $response = $client->post('/migrate', ['_token' => $token]);
    $first = $client->page();
    $second = $client->page();

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe('http://localhost/simplesaml/module.php/console/')
        ->and($first)->toContain('Migrations applied')
        ->and($first)->not->toContain('data-state=')
        ->and($second)->not->toContain('Migrations applied')
        ->and(Db::applied($client->database(), 'console_schema_version'))->toBe(range(1, 9));
});

it('records the run under the identity of the administrator', function (): void {
    $client = (new ConsoleClient())
        ->withDatabase(null)
        ->withModuleConfig(['useridattr' => 'uid'])
        ->loginAsAdmin(['uid' => ['alice']]);
    $client->post('/migrate', ['_token' => ConsoleClient::tokenIn($client->page())]);

    $rows = $client->database()->query('SELECT identity, action, schema_version FROM console_audit');

    expect($rows === false ? null : $rows->fetchAll())
        ->toBe([['identity' => 'alice', 'action' => 'migrate', 'schema_version' => 9]]);
});

it('lists only what is missing', function (): void {
    $html = (new ConsoleClient())->withDatabase([1, 2, 3, 4, 5, 6, 7, 8])->loginAsAdmin()->page();

    expect($html)->toContain('Migration 9')
        ->and($html)->not->toContain('Migration 8');
});

it('does nothing when the schema already matches', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $client->page();
    $tokens = new CsrfToken(Session::getSessionFromRequest());

    $response = $client->post('/migrate', ['_token' => $tokens->token()]);

    expect($response->getStatusCode())->toBe(302)
        ->and(Db::count($client->database(), 'console_schema_version'))->toBe(9);
});

it('reports a run that lost the race to another one and goes back to the Console', function (): void {
    $client = (new ConsoleClient())->withDatabase(null)->loginAsAdmin();
    $token = ConsoleClient::tokenIn($client->page());
    $client->database()->exec('CREATE TABLE console_entity (id INTEGER)');

    $response = $client->post('/migrate', ['_token' => $token]);
    $html = $client->page();

    expect($response->getStatusCode())->toBe(302)
        ->and($html)->toContain('Another run is applying the migrations at the same time')
        ->and($html)->toContain('data-state="pending-migrations"');
});

it('shows a failed run on the pending migrations page, with the migration and the reason', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    $pages = new StatePages(
        Configuration::getInstance(),
        new AdminAccess(Session::getSessionFromRequest()),
        new CsrfToken(Session::getSessionFromRequest()),
        new FlashMessage(Session::getSessionFromRequest()),
    );
    $report = new MigrationReport(MigrationOutcome::Failed, [1, 2], 3, 'syntax error near "<"');

    $html = ConsoleClient::body($pages->render(DatabaseStatus::ofSchema([1, 2], 9), $report));

    expect($html)->toContain('Migration 3 failed')
        ->and($html)->toContain('syntax error near &quot;&lt;&quot;')
        ->and($html)->toContain('Migration 4');
});
