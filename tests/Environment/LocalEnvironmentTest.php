<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\LocalEnvironment;

it('starts MariaDB 10.11 by default and the other engines behind profiles', function (): void {
    $services = LocalEnvironment::compose()['services'];

    expect($services['mariadb']['image'])->toBe('mariadb:10.11')
        ->and($services['mariadb'])->not->toHaveKey('profiles')
        ->and($services['postgres']['image'])->toBe('postgres:15')
        ->and($services['postgres']['profiles'])->toBe(['postgres'])
        ->and($services['mariadb-newest']['image'])->toBe('mariadb:11.8')
        ->and($services['mariadb-newest']['profiles'])->toBe(['mariadb-newest']);
});

it('gives every database a healthcheck and publishes its port', function (string $service): void {
    $definition = LocalEnvironment::compose()['services'][$service];

    expect($definition['healthcheck']['test'])->not->toBeEmpty()
        ->and($definition['ports'])->not->toBeEmpty();
})->with(['mariadb', 'postgres', 'mariadb-newest']);

it('builds the dev node on php:8.4-apache with its own database, waiting for a healthy MariaDB', function (): void {
    $dev = LocalEnvironment::compose()['services']['simplesamlphp'];

    expect($dev['profiles'])->toBe(['dev'])
        ->and($dev['depends_on']['mariadb']['condition'])->toBe('service_healthy')
        ->and(LocalEnvironment::devFile('Dockerfile'))->toContain('FROM php:8.4-apache')
        ->and(LocalEnvironment::devFile('config/config.php'))->toContain('dbname=console_dev')
        ->and(LocalEnvironment::devFile('config/config.php'))->toContain("'baseurlpath' => '/simplesaml/'")
        ->and(LocalEnvironment::devFile('config/module_console.php'))->toContain("'dev_server' => true");
});

it('puts a Vite service on the pinned Node version in front of the dev node', function (): void {
    $services = LocalEnvironment::compose()['services'];
    $vite = $services['vite'];
    $node = trim(LocalEnvironment::read('.nvmrc'));

    expect($vite['profiles'])->toBe(['dev'])
        ->and($vite['image'])->toStartWith('node:' . $node . '-')
        ->and($vite['ports'])->toBe(['5173:5173'])
        ->and($vite['environment']['CONSOLE_DEV_UPSTREAM'])->toBe('http://simplesamlphp')
        ->and($vite['depends_on']['simplesamlphp']['condition'])->toBe('service_healthy')
        ->and($services['simplesamlphp']['healthcheck']['test'])->not->toBeEmpty();
});

it('lists the Console Snapshot first in metadata.sources of the dev node', function (): void {
    $config = LocalEnvironment::devFile('config/config.php');

    expect(strpos($config, 'console:Snapshot'))->toBeInt()
        ->and(strpos($config, 'console:Snapshot'))->toBeLessThan(strpos($config, "'flatfile'"));
});

it('creates the Snapshot directory writable by the web server only', function (): void {
    expect(LocalEnvironment::devFile('Dockerfile'))->toContain('chmod 0700 /var/lib/simplesamlphp/console')
        ->and(LocalEnvironment::devFile('Dockerfile'))->toContain('chown -R www-data:www-data /var/lib/simplesamlphp');
});

it('keeps the database volume as the only persistent volume', function (): void {
    $compose = LocalEnvironment::compose();
    $named = [];
    foreach ($compose['services'] as $service) {
        foreach ($service['volumes'] ?? [] as $volume) {
            if (!str_starts_with($volume, '.')) {
                $named[] = $volume;
            }
        }
    }

    expect(array_keys($compose['volumes']))->toBe(['mariadb-data'])
        ->and($named)->toBe(['mariadb-data:/var/lib/mysql']);
});

it('excludes the environment from the package', function (): void {
    $attributes = LocalEnvironment::read('.gitattributes');

    expect($attributes)->toContain('/docker-compose.yml export-ignore')
        ->and($attributes)->toContain('/docker export-ignore');
});
