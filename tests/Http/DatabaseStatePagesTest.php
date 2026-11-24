<?php

declare(strict_types=1);

use SimpleSAML\Configuration;
use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\StatePages;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Helpers;
use SimpleSAML\Session;

it('serves the requested screen when the schema matches the code', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page();

    expect($html)->toContain('data-identity')
        ->and($html)->not->toContain('state-page');
});

it('answers every route with the Database unreachable page', function (): void {
    $html = (new ConsoleClient())->withUnreachableDatabase()->loginAsAdmin()->page();

    expect($html)->toContain('data-state="unreachable"')
        ->and($html)->toContain('Database unreachable')
        ->and($html)->toContain('keep serving their local Snapshot');
    Helpers::assertShellWithoutCounts($html);
});

it('shows the pending migrations page on a fresh install', function (): void {
    $html = (new ConsoleClient())->withDatabase(null)->loginAsAdmin()->page();

    expect($html)->toContain('data-state="pending-migrations"')
        ->and($html)->toContain('Pending migrations')
        ->and($html)->toContain('cannot be undone without restoring a backup')
        ->and($html)->toContain('SSO is not affected')
        ->and($html)->toContain('Migration 1')
        ->and($html)->toContain('Migration 9')
        ->and($html)->not->toContain('<form');
    Helpers::assertShellWithoutCounts($html);
});

it('lists only the missing migrations when the numbers are not exactly 1 to N', function (): void {
    $html = (new ConsoleClient())->withDatabase([1, 2, 4, 5, 6, 7, 8, 9])->loginAsAdmin()->page();

    expect($html)->toContain('data-state="pending-migrations"')
        ->and($html)->toContain('Migration 3')
        ->and($html)->not->toContain('Migration 4');
});

it('shows the Console older than the database page, with no way forward', function (): void {
    $html = (new ConsoleClient())->withDatabase([1, 2, 3, 10])->loginAsAdmin()->page();

    expect($html)->toContain('data-state="console-older"')
        ->and($html)->toContain('Console older than the database')
        ->and($html)->toContain('knows schema version 9')
        ->and($html)->toContain('holds schema version 10')
        ->and($html)->toContain('update the package on this node')
        ->and($html)->not->toContain('<form')
        ->and($html)->not->toContain('Migration 4');
    Helpers::assertShellWithoutCounts($html);
});

it('puts older code before missing migrations', function (): void {
    $html = (new ConsoleClient())->withDatabase([1, 12])->loginAsAdmin()->page();

    expect($html)->toContain('data-state="console-older"');
});

it('shows the SQLite too old page with the version found and the minimum', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    $pages = new StatePages(Configuration::getInstance(), new AdminAccess(Session::getSessionFromRequest()));
    $html = ConsoleClient::body($pages->render(DatabaseStatus::sqliteTooOld('3.22.0')));

    expect($html)->toContain('data-state="sqlite-too-old"')
        ->and($html)->toContain('SQLite too old')
        ->and($html)->toContain('3.22.0')
        ->and($html)->toContain('3.24.0');
    Helpers::assertShellWithoutCounts($html);
});

it('checks the state only after the admin login', function (): void {
    $script = escapeshellarg(__DIR__ . '/../Support/visit-without-login.php');
    $output = (string) shell_exec(PHP_BINARY . ' ' . $script . ' unreachable 2>/dev/null');

    expect($output)->toContain('You were redirected to')
        ->and($output)->not->toContain('data-state');
});
