<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('opens the PHP editor with the required options and an empty identity field', function (): void {
    [, $html] = EntityPages::opened();

    expect($html)->toContain('name="entityid"')
        ->and($html)->toContain('<textarea')
        ->and($html)->toContain('AssertionConsumerService')
        ->and($html)->toContain('HTTP-POST')
        ->and($html)->not->toContain('name="version"')
        ->and(EntityPages::field($html, '_token'))->toMatch('/^[0-9a-f]{64}$/')
        ->and($html)->not->toContain('data-sentinel')
        ->and($html)->not->toContain('Reveal');
});

it('creates the entity, redirects to its edit screen and records the create row', function (): void {
    [$client, $html] = EntityPages::opened();

    $response = EntityPages::submitNew($client, $html, 'https://sp.example.org', "[\n" . SpText::ACS . "\n]");
    $edit = $client->page(EntityPages::NEW);
    $rows = $client->database()->query("SELECT entity_id, version, enabled FROM console_entity")->fetchAll();
    $audit = $client->database()
        ->query("SELECT identity, action, entity_id FROM console_audit WHERE action = 'create'")
        ->fetchAll();

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(
            ConsoleClient::BASE . '/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fsp.example.org',
        )
        ->and($rows)->toBe([['entity_id' => 'https://sp.example.org', 'version' => 1, 'enabled' => 1]])
        ->and($audit)->toBe([['identity' => 'admin', 'action' => 'create', 'entity_id' => 'https://sp.example.org']])
        ->and($edit)->toContain('Saved');
});

it('takes the entity ID from the block when the identity field is empty', function (): void {
    [$client, $html] = EntityPages::opened();

    EntityPages::submitNew($client, $html, '', "\$metadata['https://block.example.org'] = [" . SpText::ACS . '];');

    expect($client->database()->query('SELECT entity_id FROM console_entity')->fetchAll())
        ->toBe([['entity_id' => 'https://block.example.org']]);
});

it('shows every error at once, linked to its line, keeps what was typed and stores nothing', function (): void {
    [$client, $html] = EntityPages::opened();
    $text = "[\n'AssertionConsumerService' => [['Binding' => 'x y', 'Location' => 'ftp://a']],\n"
        . "'sharedkey' => 'k',\n]";

    $response = EntityPages::submitNew($client, $html, '', $text);
    $page = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(422)
        ->and($page)->toContain('data-error-line="2"')
        ->and($page)->toContain('data-error-line="3"')
        ->and($page)->toContain('href="#line-2"')
        ->and($page)->toContain('class="error-mark"')
        ->and($page)->toContain('An absolute http or https URL.')
        ->and($page)->toContain('not available yet')
        ->and($page)->toContain('The entity ID is required.')
        ->and($page)->toContain('&#039;ftp://a&#039;')
        ->and($client->database()->query('SELECT COUNT(*) FROM console_entity')->fetchColumn())->toBe(0)
        ->and(EntityPages::count($client, 'console_audit', "action = 'create'"))->toBe(0);
});

it('reports text that cannot be read with its line and column', function (): void {
    [$client, $html] = EntityPages::opened();

    $response = EntityPages::submitNew($client, $html, 'https://sp.example.org', "[\n  'a' => phpinfo(),\n]");
    $page = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(422)
        ->and($page)->toContain('Line 2, column 10')
        ->and($page)->toContain('literal')
        ->and($client->database()->query('SELECT COUNT(*) FROM console_entity')->fetchColumn())->toBe(0);
});

it('says the entity already exists at the identity field, with a link to it, and keeps the text', function (): void {
    [$client, $html] = EntityPages::opened();
    EntityPages::submitNew($client, $html, 'https://sp.example.org', '[' . SpText::ACS . ']');
    $text = "[\n" . SpText::ACS . "\n'scope' => ['typed.example.org'],\n]";

    $response = EntityPages::submitNew($client, $html, 'https://sp.example.org', $text);
    $page = ConsoleClient::body($response);

    expect($response->getStatusCode())->toBe(422)
        ->and($page)->toContain('data-field-error="entityid"')
        ->and($page)->toContain('already exists')
        ->and($page)->toContain('edit?entityid=https%3A%2F%2Fsp.example.org')
        ->and($page)->toContain('typed.example.org')
        ->and($client->database()->query('SELECT COUNT(*) FROM console_entity')->fetchColumn())->toBe(1);
});
