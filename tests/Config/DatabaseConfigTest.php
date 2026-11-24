<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;
use SimpleSAML\Module\console\Tests\Support\Helpers;

it('builds the connection from the core database settings', function (): void {
    Helpers::configure([
        'database.dsn' => 'pgsql:host=core;dbname=ssp',
        'database.username' => 'core-user',
        'database.password' => 'core-secret',
        'database.prefix' => 'ssp_',
        'database.slaves' => [['dsn' => 'pgsql:host=replica', 'username' => 'r', 'password' => 'r']],
        'database.persistent' => true,
    ]);

    $settings = ModuleConfig::database();

    expect($settings->dsn)->toBe('pgsql:host=core;dbname=ssp')
        ->and($settings->username)->toBe('core-user')
        ->and($settings->password)->toBe('core-secret')
        ->and($settings->prefix)->toBe('ssp_');
});

it('uses core defaults for the settings core leaves out', function (): void {
    Helpers::configure([]);

    $settings = ModuleConfig::database();

    expect($settings->dsn)->toBe('mysql:host=localhost;dbname=simplesaml')
        ->and($settings->username)->toBeNull()
        ->and($settings->password)->toBeNull()
        ->and($settings->prefix)->toBe('');
});

it('replaces the four core values as a whole with the module database option', function (): void {
    Helpers::configure(
        ['database.dsn' => 'mysql:host=core', 'database.username' => 'core-user', 'database.prefix' => 'ssp_'],
        ['database' => ['dsn' => 'sqlite:/data/console.sqlite']],
    );

    $settings = ModuleConfig::database();

    expect($settings->dsn)->toBe('sqlite:/data/console.sqlite')
        ->and($settings->username)->toBeNull()
        ->and($settings->password)->toBeNull()
        ->and($settings->prefix)->toBe('');
});

it('takes username, password and prefix from the module database option', function (): void {
    Helpers::configure([], [
        'database' => ['dsn' => 'mysql:host=x', 'username' => 'u', 'password' => 'p', 'prefix' => 'c_'],
    ]);

    $settings = ModuleConfig::database();

    expect($settings->username)->toBe('u')
        ->and($settings->password)->toBe('p')
        ->and($settings->prefix)->toBe('c_');
});

it('requires dsn inside the module database option', function (): void {
    Helpers::configure([], ['database' => ['username' => 'u']]);

    expect(fn () => ModuleConfig::database())
        ->toThrow(\Exception::class, "Could not retrieve the required option 'dsn'");
});
