<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('answers 422 with every error at its line, the missing entity ID on the $metadata line', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $text = "\$metadata[''] = [\n'AssertionConsumerService' => [['Binding' => 'x y', 'Location' => 'ftp://a']],\n"
        . "'sharedkey' => 'k',\n];";

    $response = EntityApi::create($client, $text);
    $body = Api::json($response);
    $at = array_combine(array_column($body['errors'], 'message'), array_column($body['errors'], 'line'));
    $url = array_values(array_filter(
        $body['errors'],
        static fn (array $e): bool => str_contains($e['message'], 'An absolute http or https URL.'),
    ));

    expect($response->getStatusCode())->toBe(422)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($body['readable'])->toBeTrue()
        ->and($at['The entity ID is required.'])->toBe(1)
        ->and($at["The option 'sharedkey' is not available yet."])->toBe(3)
        ->and($url)->toHaveCount(1)
        ->and($url[0]['pointer'])->toStartWith('/AssertionConsumerService/0/')
        ->and($url[0]['line'])->toBe(2)
        ->and(array_column($body['errors'], 'line'))->each->toBeInt()
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0)
        ->and(EntityPages::count($client, 'console_audit', "action = 'create'"))->toBe(0);
});

it('puts an entity ID over 1024 bytes on the line that holds it', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $long = 'https://sp.example.org/' . str_repeat('a', 1010);

    $body = Api::json(EntityApi::create($client, "\n\$metadata['$long'] = [\n" . SpText::ACS . "\n];"));

    expect($body['errors'])->toBe([[
        'pointer' => '',
        'message' => 'The entity ID is at most 1024 bytes long.',
        'line' => 2,
        'column' => null,
    ]])->and(EntityPages::count($client, 'console_entity'))->toBe(0);
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

it('answers a create that loses the race for its entity ID as already exists, not as a conflict', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    // Another create lands between the check and the insert: the insert meets the primary key.
    $client->database()->exec(
        "CREATE TRIGGER race BEFORE INSERT ON console_entity BEGIN "
        . "SELECT RAISE(ABORT, 'UNIQUE constraint failed: console_entity.entity_set, console_entity.entity_id'); END",
    );

    $response = EntityApi::create($client, "\$metadata['https://race.example.org'] = [" . SpText::ACS . '];');
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(422)
        ->and($body['errors'])->toHaveCount(1)
        ->and($body['errors'][0]['message'])->toBe('A service provider with this entity ID already exists.')
        ->and($body['errors'][0]['line'])->toBe(1)
        ->and($body['errors'][0]['existing']['entityId'])->toBe('https://race.example.org')
        ->and(EntityPages::count($client, 'console_audit', "action = 'create'"))->toBe(0);
});
