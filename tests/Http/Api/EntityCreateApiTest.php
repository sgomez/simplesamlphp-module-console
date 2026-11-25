<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('creates the entity whose ID the $metadata line holds, records a create row, and answers it', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();

    $response = EntityApi::create($client, "\$metadata['https://new.example.org'] = [" . SpText::ACS . '];');
    $created = Api::json($response);
    $rows = $client->database()->query('SELECT entity_id, version, enabled FROM console_entity')->fetchAll();
    $audit = $client->database()
        ->query("SELECT identity, action, entity_id FROM console_audit WHERE action = 'create'")
        ->fetchAll();

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($created['entityId'])->toBe('https://new.example.org')
        ->and($created['version'])->toBe(1)
        ->and($created['state'])->toBe('Unpublished')
        ->and($created['php'])->toStartWith("\$metadata['https://new.example.org'] = [")
        ->and($rows)->toBe([['entity_id' => 'https://new.example.org', 'version' => 1, 'enabled' => 1]])
        ->and($audit)->toBe([['identity' => 'admin', 'action' => 'create', 'entity_id' => 'https://new.example.org']]);
});

it('takes the entity ID from the entityid option of a bare array', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();

    EntityApi::create($client, "[\n'entityid' => 'https://inside.example.org',\n" . SpText::ACS . "\n]");

    expect($client->database()->query('SELECT entity_id FROM console_entity')->fetchAll())
        ->toBe([['entity_id' => 'https://inside.example.org']]);
});

it('answers the notices of the create, such as Did you mean', function (): void {
    $created = Api::json(EntityApi::create(
        (new ConsoleClient())->loginAsAdmin(),
        "\$metadata['https://new.example.org'] = [\n" . SpText::ACS . "\n'SingleLogoutServices' => 1,\n];",
    ));

    expect($created['entityId'])->toBe('https://new.example.org')
        ->and($created['notices'])->toHaveCount(1)
        ->and($created['notices'][0]['message'])->toContain('Did you mean')
        ->and($created['notices'][0]['line'])->toBe(3);
});

it('answers 422 with every error at its line, the missing entity ID on the $metadata line', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $text = "\$metadata[''] = [\n'AssertionConsumerService' => [['Binding' => 'x y', 'Location' => 'ftp://a']],\n"
        . "'sharedkey' => 'k',\n];";

    $response = EntityApi::create($client, $text);
    $body = Api::json($response);
    $at = array_combine(array_column($body['errors'], 'message'), array_column($body['errors'], 'line'));

    expect($response->getStatusCode())->toBe(422)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($body['readable'])->toBeTrue()
        ->and($at['The entity ID is required.'])->toBe(1)
        ->and($at["The option 'sharedkey' is not available yet."])->toBe(3)
        ->and(array_column($body['errors'], 'line'))->each->toBeInt()
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0)
        ->and(EntityPages::count($client, 'console_audit', "action = 'create'"))->toBe(0);
});

it('says a text that cannot be read is unreadable, with its line and column', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();

    $body = Api::json(EntityApi::create($client, "[\n  'a' => phpinfo(),\n]"));

    expect($body['readable'])->toBeFalse()
        ->and($body['errors'])->toHaveCount(1)
        ->and($body['errors'][0]['line'])->toBe(2)
        ->and($body['errors'][0]['column'])->toBe(10)
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0);
});

it('says the entity already exists on the $metadata line, names it, and stores nothing', function (): void {
    $client = EntityApi::existing();

    $response = EntityApi::create($client, "\n\$metadata['https://sp.example.org'] = [\n" . SpText::ACS . "\n];");
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(422)
        ->and($body['readable'])->toBeTrue()
        ->and($body['errors'])->toBe([[
            'pointer' => '',
            'message' => 'A service provider with this entity ID already exists.',
            'line' => 2,
            'column' => null,
            'existing' => ['entityId' => 'https://sp.example.org', 'name' => 'Example'],
        ]])
        ->and(EntityApi::version($client))->toBe(1)
        ->and(EntityPages::count($client, 'console_entity'))->toBe(1);
});
