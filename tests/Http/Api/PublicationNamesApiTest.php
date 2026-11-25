<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;
use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('names each change, a Deleted one by its name in the current Snapshot', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org', P::VALID + ['name' => ['en' => 'Alpha']]);
    P::seed($client, 'https://b.example.org', P::VALID + ['name' => ['en' => 'Beta']]);
    P::publish($client);
    (new PdoEntityRepository($client->database(), ''))
        ->update('saml20-sp-remote', 'https://a.example.org', 1, P::VALID + ['name' => ['en' => 'Alpha 2']], 'admin');
    $client->database()->exec("DELETE FROM console_entity WHERE entity_id = 'https://b.example.org'");
    P::seed($client, 'https://c.example.org');

    $groups = Api::get($client, P::PATH)['groups'];

    expect($groups)->toBe([
        ['state' => 'Unpublished', 'changes' => [
            ['entityId' => 'https://c.example.org', 'name' => null, 'loadError' => null, 'opens' => true],
        ]],
        ['state' => 'Modified', 'changes' => [
            ['entityId' => 'https://a.example.org', 'name' => 'Alpha 2', 'loadError' => null, 'opens' => true],
        ]],
        ['state' => 'Deleted', 'changes' => [
            ['entityId' => 'https://b.example.org', 'name' => 'Beta', 'loadError' => null, 'opens' => false],
        ]],
    ]);
});

it('answers the warnings of the Pending changes, each with its object and name', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://quiet.example.org', P::VALID + ['name' => ['en' => 'Quiet']]);
    P::publish($client);
    P::seed($client, 'https://loud.example.org', P::VALID + ['name' => ['en' => 'Loud'], 'sign.logout' => false]);
    P::seed($client, 'my-sp');

    $warnings = Api::get($client, P::PATH)['warnings'];

    expect($warnings)->toBe([
        [
            'entityId' => 'https://loud.example.org',
            'name' => 'Loud',
            'message' => 'Signing or signature checking is switched off: sign.logout.',
        ],
        ['entityId' => 'my-sp', 'name' => null, 'message' => 'The entity ID is not an absolute URI.'],
    ]);
});

it('names the object of each problem, on the screen and in a refused Publication', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org', ['bogus' => true, 'name' => ['en' => 'Alpha']]);

    $problems = Api::get($client, P::PATH)['problems'];
    $response = P::publish($client);
    $refused = Api::json($response);

    expect($problems[0]['name'])->toBe('Alpha')
        ->and($problems[0]['entityId'])->toBe('https://a.example.org')
        ->and($response->getStatusCode())->toBe(409)
        ->and($response->headers->get('Content-Type'))->toBe('application/json')
        ->and($refused['code'])->toBe('blocked')
        ->and($refused['problems'][0]['name'])->toBe('Alpha');
});
