<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('says an entity never published is not in the current Snapshot', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seedUnreadable($client);
    P::seed($client, 'https://a.example.org');

    $rows = Api::get($client, '/entities/saml20-sp-remote')['rows'];
    $bad = Api::get($client, '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fbad.example.org');

    expect(array_column($rows, 'inSnapshot'))->toBe([false, false])
        ->and($bad['inSnapshot'])->toBeFalse();
});

it('says a published entity is in the current Snapshot, Unreadable or not', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://bad.example.org');
    P::publish($client);
    $client->database()->exec(
        "UPDATE console_entity SET document = '{oops' WHERE entity_id = 'https://bad.example.org'",
    );
    P::seed($client, 'https://new.example.org');

    $rows = Api::get($client, '/entities/saml20-sp-remote')['rows'];
    $bad = Api::get($client, '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fbad.example.org');

    expect(array_column($rows, 'inSnapshot', 'entityId'))->toBe([
        'https://a.example.org' => true,
        'https://bad.example.org' => true,
        'https://new.example.org' => false,
    ])->and($bad['inSnapshot'])->toBeTrue()
        ->and($bad['unreadable'])->toBeTrue();
});
