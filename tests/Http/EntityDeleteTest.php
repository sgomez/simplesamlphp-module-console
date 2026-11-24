<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\EntityPages;

const DELETE_PATH = '/entities/saml20-sp-remote/delete';

it('offers Delete with a confirmation text on the edit screen and on the list row', function (): void {
    [$client, $edit] = EntityPages::existing();

    $list = $client->page(EntityPages::LIST);

    expect($edit)->toContain('data-confirm="')
        ->and($edit)->toContain('action="' . ConsoleClient::BASE . DELETE_PATH . '"')
        ->and($list)->toContain('data-confirm="')
        ->and($list)->toContain('action="' . ConsoleClient::BASE . DELETE_PATH . '"');
});

it('deletes the entity, writing a delete row without a document, and says so on the list', function (): void {
    [$client, $edit] = EntityPages::existing();

    $response = $client->post(DELETE_PATH, [
        '_token' => EntityPages::field($edit, '_token'),
        'entityid' => 'https://sp.example.org',
    ]);
    $list = $client->page(EntityPages::LIST);
    $audit = $client->database()->query("SELECT identity, document FROM console_audit WHERE action = 'delete'")
        ->fetchAll();

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(ConsoleClient::BASE . EntityPages::LIST)
        ->and(EntityPages::count($client, 'console_entity'))->toBe(0)
        ->and($list)->toContain('Deleted')
        ->and($list)->toContain('No service providers yet')
        ->and($audit)->toBe([['identity' => 'admin', 'document' => null]]);
});

it('lists an Unreadable row with Delete as its only action, and deletes it', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seedUnreadable($client);

    $list = $client->page(EntityPages::LIST);
    $response = $client->post(DELETE_PATH, [
        '_token' => EntityPages::field($list, '_token'),
        'entityid' => 'https://bad.example.org',
    ]);

    expect($list)->toContain('Unreadable')
        ->and($list)->toContain('not valid JSON')
        ->and($list)->toContain('data-confirm="')
        ->and($list)->not->toContain('/edit?entityid=')
        ->and($response->getStatusCode())->toBe(302)
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
