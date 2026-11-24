<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

it('answers the identity and the two links to core', function (): void {
    $session = Api::get((new ConsoleClient())->loginAsAdmin(), '/session');

    expect($session['identity'])->toBe('admin')
        ->and($session['adminUrl'])->toBe('http://localhost/simplesaml/module.php/admin/')
        ->and($session['logoutUrl'])->toContain('/module.php/core/logout/admin');
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
