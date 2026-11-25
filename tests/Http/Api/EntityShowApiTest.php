<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

it('answers the entity as the $metadata statement of a flat file, with its name, version and state', function (): void {
    $client = EntityApi::existing();

    $response = $client->api('GET', EntityApi::ENTITY);
    $entity = Api::json($response);

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($entity['entityId'])->toBe('https://sp.example.org')
        ->and($entity['name'])->toBe('Example')
        ->and($entity['version'])->toBe(1)
        ->and($entity['state'])->toBe('Unpublished')
        ->and($entity['php'])->toStartWith("\$metadata['https://sp.example.org'] = [")
        ->and($entity['php'])->toContain("'name' => [")
        ->and($entity['unreadable'])->toBeFalse()
        ->and($entity['notices'])->toBe([]);
});

it('answers 404 for an entity that does not exist', function (): void {
    $response = (new ConsoleClient())->loginAsAdmin()->api('GET', '/entities/saml20-sp-remote/entity?entityid=nope');

    expect($response->getStatusCode())->toBe(404);
});

it('answers the load error of an entity that cannot be read, without a text', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seedUnreadable($client);

    $entity = Api::get($client, '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fbad.example.org');

    expect($entity['unreadable'])->toBeTrue()
        ->and($entity['error'])->toContain('not valid JSON')
        ->and($entity['php'])->toBeNull()
        ->and($entity['state'])->toBe('Unreadable');
});

it('answers the warnings of an entity apart from errors', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'my-sp', ['extra' => ['consent.disable' => true], 'sign.logout' => false]);

    $entity = Api::get($client, '/entities/saml20-sp-remote/entity?entityid=my-sp');

    expect(array_column($entity['warnings'], 'message'))->toContain('The entity ID is not an absolute URI.')
        ->and(array_column($entity['warnings'], 'label'))->toContain('Uses extra')->toContain('Signing off');
});

it('answers the errors of a stored entity that the current schema rejects, and none of a sound one', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seedInvalid($client, 'https://bad.example.org');

    $bad = Api::get($client, '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fbad.example.org');

    expect($bad['errors'])->not->toBe([])
        ->and($bad['errors'][0])->toHaveKeys(['pointer', 'message', 'line', 'column'])
        ->and(Api::get(EntityApi::existing(), EntityApi::ENTITY)['errors'])->toBe([]);
});

it('answers the errors of a stored entity with a valid endpoint and an unknown option', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://bogus.example.org', ['bogus' => true]);

    $entity = Api::get($client, '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fbogus.example.org');

    expect($entity['errors'])->not->toBe([])
        ->and($entity['errors'][0]['line'])->toBeNull();
});

it('answers no warnings for a sound entity', function (): void {
    expect(Api::get(EntityApi::existing(), EntityApi::ENTITY)['warnings'])->toBe([]);
});

it('passes through the gate', function (): void {
    expect((new ConsoleClient())->api('GET', EntityApi::ENTITY)->getStatusCode())->toBe(401)
        ->and((new ConsoleClient())->withDatabase(null)->loginAsAdmin()->api('GET', EntityApi::ENTITY)
            ->getStatusCode())->toBe(503);
});
