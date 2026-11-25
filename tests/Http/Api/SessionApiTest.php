<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures;

it('answers the identity, logout and the links to core\'s three admin pages', function (): void {
    $session = Api::get((new ConsoleClient())->loginAsAdmin(), '/session');

    expect($session['identity'])->toBe('admin')
        ->and($session['core'])->toBe([
            'configuration' => 'http://localhost/simplesaml/module.php/admin/',
            'test' => 'http://localhost/simplesaml/module.php/admin/test',
            'federation' => 'http://localhost/simplesaml/module.php/admin/federation',
        ])
        ->and($session['logoutUrl'])->toContain('/module.php/core/logout/admin')
        ->and($session)->not->toHaveKey('adminUrl');
});

it('answers the first value of useridattr as the identity', function (): void {
    $client = (new ConsoleClient())->withModuleConfig(['useridattr' => 'uid'])->loginAsAdmin(['uid' => ['alice']]);

    expect(Api::get($client, '/session')['identity'])->toBe('alice');
});

it('counts the Pending changes', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    expect(Api::get($client, '/session')['pendingCount'])->toBe(0);

    EntityDb::seed($client, 'https://a.example.org');
    EntityDb::seed($client, 'https://b.example.org');

    expect(Api::get($client, '/session')['pendingCount'])->toBe(2);
});

it('counts the service providers for the sidebar, disabled ones included', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    expect(Api::get($client, '/session')['counts'])->toBe(['saml20-sp-remote' => 0]);

    EntityDb::seed($client, 'https://a.example.org');
    EntityDb::seed($client, 'https://b.example.org');
    $client->database()->exec("UPDATE console_entity SET enabled = 0 WHERE entity_id = 'https://b.example.org'");

    expect(Api::get($client, '/session')['counts'])->toBe(['saml20-sp-remote' => 2]);
});

it('answers the current Snapshot, its number and when it was published', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    expect(Api::get($client, '/session')['current'])->toBeNull();

    PublishFixtures::seed($client, 'https://a.example.org');
    PublishFixtures::publish($client);
    PublishFixtures::seed($client, 'https://b.example.org');
    PublishFixtures::publish($client);
    $createdAt = $client->database()->query('SELECT created_at FROM console_snapshot WHERE number = 2')->fetchColumn();

    expect(Api::get($client, '/session')['current'])->toBe(['number' => 2, 'createdAt' => $createdAt]);
});

it('returns from logout to the Console, not to the API', function (): void {
    $logout = Api::get((new ConsoleClient())->loginAsAdmin(), '/session')['logoutUrl'];
    parse_str((string) parse_url($logout, PHP_URL_QUERY), $query);

    expect($query['ReturnTo'] ?? null)->toBe('http://localhost/simplesaml/module.php/console/');
});
