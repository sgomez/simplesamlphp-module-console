<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\Flash;

const DELETE_PATH = '/entities/saml20-sp-remote/delete';

it('deletes the entity, writing a delete row without a document, and leaves a message', function (): void {
    [$client, $edit] = EntityPages::existing();

    $response = $client->post(DELETE_PATH, [
        '_token' => EntityPages::field($edit, '_token'),
        'entityid' => 'https://sp.example.org',
    ]);
    $audit = $client->database()->query("SELECT identity, document FROM console_audit WHERE action = 'delete'")
        ->fetchAll();

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(ConsoleClient::BASE . EntityPages::LIST)
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0)
        ->and(Flash::taken())->toContain('Deleted')
        ->and($audit)->toBe([['identity' => 'admin', 'document' => null]]);
});

it('deletes an Unreadable row', function (): void {
    [$client, $new] = EntityPages::opened();
    EntityDb::seedUnreadable($client);

    $response = $client->post(DELETE_PATH, [
        '_token' => EntityPages::field($new, '_token'),
        'entityid' => 'https://bad.example.org',
    ]);

    expect($response->getStatusCode())->toBe(302)
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0);
});

it('does nothing for an entity that is already gone', function (): void {
    [$client, $new] = EntityPages::opened();

    $response = $client->post(DELETE_PATH, [
        '_token' => EntityPages::field($new, '_token'),
        'entityid' => 'https://gone.example.org',
    ]);

    expect($response->getStatusCode())->toBe(302)
        ->and(EntityPages::count($client, 'console_audit', "action = 'delete'"))->toBe(0);
});
