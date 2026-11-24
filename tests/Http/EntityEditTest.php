<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\Flash;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('shows the entity as the $metadata statement of a flat file, with its header and version', function (): void {
    [, $html] = EntityPages::existing();

    expect($html)->toContain('Example')
        ->and($html)->toContain('saml20-sp-remote')
        ->and($html)->toContain('https://sp.example.org')
        ->and($html)->toContain('$metadata[&#039;https://sp.example.org&#039;] = [')
        ->and(EntityPages::field($html, 'version'))->toBe('1')
        ->and(EntityPages::field($html, 'entityid'))->toBe('https://sp.example.org');
});

it('answers 404 for an entity that does not exist', function (): void {
    $response = (new ConsoleClient())->loginAsAdmin()->get('/entities/saml20-sp-remote/edit?entityid=nope');

    expect($response->getStatusCode())->toBe(404);
});

it('saves an edit, bumps the version and records an edit row', function (): void {
    [$client, $html] = EntityPages::existing();

    $text = "[\n" . SpText::ACS . "\n'name' => 'Renamed',\n'scope' => 'example.org',\n]";
    $response = EntityPages::submitEdit($client, $html, $text);
    $page = $client->page(EntityPages::EDIT);
    $audit = $client->database()->query("SELECT action, identity FROM console_audit WHERE action = 'edit'")->fetchAll();

    expect($response->getStatusCode())->toBe(302)
        ->and(EntityPages::field($page, 'version'))->toBe('2')
        ->and($page)->toContain('Renamed')
        ->and($page)->toContain('&#039;scope&#039; =&gt; [')
        ->and($audit)->toBe([['action' => 'edit', 'identity' => 'admin']]);
});

it('hands the text back in schema order', function (): void {
    [$client, $html] = EntityPages::existing();

    EntityPages::submitEdit($client, $html, "[\n'name' => 'Renamed',\n" . SpText::ACS . "\n]");
    $page = $client->page(EntityPages::EDIT);

    expect(strpos($page, 'AssertionConsumerService'))->toBeLessThan((int) strpos($page, '&#039;name&#039; =&gt;'));
});

it('shows the errors of an edit, stores nothing and keeps the version', function (): void {
    [$client, $html] = EntityPages::existing();

    $response = EntityPages::submitEdit($client, $html, "[\n" . SpText::ACS . "\n'hide.from.discovery' => 'yes',\n]");
    $page = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(422)
        ->and($page)->toContain('data-error-line="3"')
        ->and(EntityPages::field($page, 'version'))->toBe('1')
        ->and(EntityPages::count($client, 'console_audit', "action = 'edit'"))->toBe(0);
});

it('rejects a save made on a stale version and shows the entity as it now stands', function (): void {
    [$client, $html] = EntityPages::existing();
    EntityPages::submitEdit($client, $html, "[\n" . SpText::ACS . "\n'name' => 'Theirs',\n]");

    $response = EntityPages::submitEdit($client, $html, "[\n" . SpText::ACS . "\n'name' => 'Mine',\n]", '1');
    $page = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(409)
        ->and($page)->toContain('changed meanwhile')
        ->and($page)->toContain('Theirs')
        ->and($page)->not->toContain('Mine')
        ->and(EntityPages::field($page, 'version'))->toBe('2')
        ->and($client->database()->query('SELECT version FROM console_entity')->fetchColumn())->toBe(2);
});

it('sends an edit of an entity deleted meanwhile back to the list with a message', function (): void {
    [$client, $html] = EntityPages::existing();
    $client->database()->exec('DELETE FROM console_entity');

    $response = EntityPages::submitEdit($client, $html, '[' . SpText::ACS . ']');

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(ConsoleClient::BASE . EntityPages::LIST)
        ->and(Flash::taken())->toContain('no longer exists');
});
