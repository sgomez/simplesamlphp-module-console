<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\EntityPages;

it('deletes the entity and writes a delete row without a document', function (): void {
    $client = EntityApi::existing();

    $response = EntityApi::delete($client, EntityApi::ID);
    $audit = $client->database()
        ->query("SELECT identity, entity_id, document FROM console_audit WHERE action = 'delete'")
        ->fetchAll();

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and(Api::json($response))->toBe(['entityid' => EntityApi::ID])
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0)
        ->and($audit)->toBe([['identity' => 'admin', 'entity_id' => EntityApi::ID, 'document' => null]]);
});

it('deletes only the entity it names', function (): void {
    $client = EntityApi::existing();
    EntityDb::seed($client, 'https://other.example.org');

    EntityApi::delete($client, EntityApi::ID);
    $left = $client->database()->query('SELECT entity_id FROM console_entity')->fetchAll(\PDO::FETCH_COLUMN);

    expect($left)->toBe(['https://other.example.org']);
});

it('deletes an Unreadable row', function (): void {
    $client = EntityApi::existing();
    EntityDb::seedUnreadable($client);

    $response = EntityApi::delete($client, 'https://bad.example.org');

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityPages::count($client, 'console_entity', "entity_id = 'https://bad.example.org'"))->toBe(0)
        ->and(EntityPages::count($client, 'console_audit', "action = 'delete'"))->toBe(1);
});

it('answers 200 and writes nothing for an entity that is already gone', function (): void {
    $client = EntityApi::existing();
    EntityApi::delete($client, EntityApi::ID);

    $response = EntityApi::delete($client, EntityApi::ID);

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityPages::count($client, 'console_audit', "action = 'delete'"))->toBe(1);
});

it('deletes nothing when the body names no entity ID', function (): void {
    $client = EntityApi::existing();

    $response = EntityApi::post($client, EntityApi::DELETE, ['entityid' => [EntityApi::ID]]);

    expect($response->getStatusCode())->toBe(200)
        ->and(Api::json($response))->toBe(['entityid' => ''])
        ->and(EntityPages::count($client, 'console_entity'))->toBe(1);
});
