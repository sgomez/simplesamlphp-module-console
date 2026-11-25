<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\SpText;

const STARTER = '/entities/saml20-sp-remote/entity';

it('answers the starter text of a new service provider, its entity ID left to the $metadata line', function (): void {
    $response = (new ConsoleClient())->loginAsAdmin()->api('GET', STARTER);
    $starter = Api::json($response);

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($starter['entityId'])->toBe('')
        ->and($starter['version'])->toBe(0)
        ->and($starter['state'])->toBeNull()
        ->and($starter['php'])->toStartWith("\$metadata[''] = [\n    'AssertionConsumerService' => [")
        ->and($starter['php'])->toContain("'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST'")
        ->and($starter['php'])->toEndWith('];')
        ->and($starter['warnings'])->toBe([])
        ->and($starter['notices'])->toBe([]);
});

it('validates a new entity as its create would, already exists included', function (): void {
    $client = EntityApi::existing();
    $taken = "\$metadata['https://sp.example.org'] = [" . SpText::ACS . '];';
    $exists = Api::json(EntityApi::validate($client, $taken, ''));
    $missing = Api::json(EntityApi::validate($client, "\$metadata[''] = [" . SpText::ACS . '];', ''));

    expect($exists['errors'][0]['message'])->toBe('A service provider with this entity ID already exists.')
        ->and($exists['errors'][0]['line'])->toBe(1)
        ->and($exists['errors'][0]['existing']['entityId'])->toBe('https://sp.example.org')
        ->and($missing['errors'][0]['message'])->toBe('The entity ID is required.')
        ->and($missing['errors'][0]['line'])->toBe(1);
});

it('puts the already exists error on the entityid option of a bare array', function (): void {
    $body = Api::json(EntityApi::create(
        EntityApi::existing(),
        "[\n" . SpText::ACS . "\n'entityid' => 'https://sp.example.org',\n]",
    ));

    expect($body['errors'][0]['line'])->toBe(3)->and($body['errors'][0]['existing']['name'])->toBe('Example');
});

it('passes the starter through the gate', function (): void {
    expect((new ConsoleClient())->api('GET', STARTER)->getStatusCode())->toBe(401);
});
