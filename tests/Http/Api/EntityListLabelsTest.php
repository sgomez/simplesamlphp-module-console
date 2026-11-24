<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

it('lists a row that cannot be loaded as Unreadable, with its load error', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seedUnreadable($client);

    $row = Api::get($client, '/entities/saml20-sp-remote')['rows'][0];

    expect($row['entityId'])->toBe('https://bad.example.org')
        ->and($row['state'])->toBe('Unreadable')
        ->and($row['unreadable'])->toBeTrue()
        ->and($row['error'])->toContain('not valid JSON');
});

it('says a disabled row that cannot be loaded is Unreadable, although it has no state', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seedUnreadable($client);
    $client->database()->exec('UPDATE console_entity SET enabled = 0');

    $row = Api::get($client, '/entities/saml20-sp-remote')['rows'][0];

    expect($row['state'])->toBeNull()
        ->and($row['unreadable'])->toBeTrue()
        ->and($row['labels'])->toBe([['text' => 'Disabled', 'kind' => 'disabled', 'title' => null]])
        ->and($row['error'])->toContain('not valid JSON');
});

it('labels a disabled service provider', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://off.example.org');
    $client->database()->exec('UPDATE console_entity SET enabled = 0');

    $row = Api::get($client, '/entities/saml20-sp-remote')['rows'][0];

    expect($row['labels'])->toBe([['text' => 'Disabled', 'kind' => 'disabled', 'title' => null]])
        ->and($row['state'])->toBeNull()
        ->and($row['unreadable'])->toBeFalse();
});

it('labels the warnings of a service provider with their message, and none of a sound one', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'my-sp', ['saml20.sign.response' => false]);
    EntityDb::seed($client, 'https://sp.example.org');

    [$sound, $warned] = Api::get($client, '/entities/saml20-sp-remote')['rows'];

    expect(array_column($warned['labels'], 'text'))->toContain('Signing off')->toContain('Entity ID not a URI')
        ->and(array_unique(array_column($warned['labels'], 'kind')))->toBe(['warning'])
        ->and($warned['labels'][0]['title'])->toBeString()->not->toBe('')
        ->and($sound['labels'])->toBe([]);
});

it('labels a certificate within the configured days of expiring, and not one far from it', function (): void {
    $seed = static function (ConsoleClient $client): ConsoleClient {
        EntityDb::seed($client, 'https://sp.example.org', [
            'certificates' => [['pem' => SpFixtures::pem(), 'use' => 'both']],
        ]);

        return $client;
    };
    $labels = static fn (ConsoleClient $c): array
        => array_column(Api::get($c, '/entities/saml20-sp-remote')['rows'][0]['labels'], 'text');

    $near = $labels($seed((new ConsoleClient())->withModuleConfig(['cert_expiry_warning_days' => 4000])
        ->loginAsAdmin()));
    $far = $labels($seed((new ConsoleClient())->loginAsAdmin()));

    expect($near)->toContain('Certificate expiring')->and($far)->not->toContain('Certificate expiring');
});
