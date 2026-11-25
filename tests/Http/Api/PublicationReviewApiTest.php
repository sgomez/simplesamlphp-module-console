<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;
use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

const EDIT_A = '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fa.example.org';

it('answers nothing to publish before the first Publication', function (): void {
    $review = Api::get((new ConsoleClient())->loginAsAdmin(), P::PATH);

    expect($review['groups'])->toBe([])
        ->and($review['problems'])->toBe([])
        ->and($review['warnings'])->toBe([])
        ->and($review['hash'])->toMatch('/^[0-9a-f]{64}$/')
        ->and($review['nextNumber'])->toBe(1)
        ->and($review['current'])->toBeNull()
        ->and($review['canPublish'])->toBeFalse();
});

it('answers the Pending changes grouped by state, each with a link to edit it', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $review = Api::get($client, P::PATH);

    expect($review['groups'])->toBe([[
        'state' => 'Unpublished',
        'changes' => [['entityId' => 'https://a.example.org', 'loadError' => null, 'edit' => EDIT_A]],
    ]])->and($review['canPublish'])->toBeTrue()
        ->and($review['nextNumber'])->toBe(1);
});

it('answers the problems that block, each naming its entity, and no link for an Unreadable row', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org', ['AssertionConsumerService' => [['Binding' => 'urn:a:b']]]);
    EntityDb::seedUnreadable($client);

    $review = Api::get($client, P::PATH);
    $unreadable = $review['groups'][1];

    expect(array_column($review['problems'], 'entityId'))->toBe(['https://a.example.org', 'https://bad.example.org'])
        ->and($review['problems'][0]['edit'])->toBe(EDIT_A)
        ->and($review['problems'][1]['message'])->toContain('not valid JSON')
        ->and($unreadable['state'])->toBe('Unreadable')
        ->and($unreadable['changes'][0]['edit'])->toBeNull()
        ->and($unreadable['changes'][0]['loadError'])->toContain('not valid JSON')
        ->and($review['canPublish'])->toBeFalse();
});

it('answers Modified with a link and Deleted without one', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://b.example.org');
    P::publish($client);
    (new PdoEntityRepository($client->database(), ''))
        ->update('saml20-sp-remote', 'https://a.example.org', 1, P::VALID + ['name' => ['en' => 'A']], 'admin');
    $client->database()->exec("DELETE FROM console_entity WHERE entity_id = 'https://b.example.org'");

    $groups = Api::get($client, P::PATH)['groups'];

    expect(array_column($groups, 'state'))->toBe(['Modified', 'Deleted'])
        ->and($groups[0]['changes'][0]['edit'])->toBe(EDIT_A)
        ->and($groups[1]['changes'][0]['edit'])->toBeNull();
});

it('answers 401 without an admin session', function (): void {
    expect((new ConsoleClient())->api('GET', P::PATH)->getStatusCode())->toBe(401);
});
