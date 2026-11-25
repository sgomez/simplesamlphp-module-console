<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('saves an edit, bumps the version, records an edit row and answers the normalised text', function (): void {
    $client = EntityApi::existing();

    $response = EntityApi::save($client, "[\n" . SpText::ACS . "\n'name' => 'Renamed',\n'scope' => 'example.org',\n]");
    $saved = Api::json($response);
    $audit = $client->database()->query("SELECT action, identity FROM console_audit WHERE action = 'edit'")->fetchAll();

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($saved['version'])->toBe(2)
        ->and($saved['name'])->toBe('Renamed')
        ->and($saved['state'])->toBe('Unpublished')
        ->and($saved['php'])->toStartWith("\$metadata['https://sp.example.org'] = [")
        ->and($saved['php'])->toContain("'scope' => [")
        ->and(EntityApi::version($client))->toBe(2)
        ->and($audit)->toBe([['action' => 'edit', 'identity' => 'admin']]);
});

it('hands the text back in schema order', function (): void {
    $php = Api::json(EntityApi::save(EntityApi::existing(), "[\n'name' => 'Renamed',\n" . SpText::ACS . "\n]"))['php'];

    expect(strpos($php, 'AssertionConsumerService'))->toBeLessThan((int) strpos($php, "'name' =>"));
});

it('answers 422 with every error, its pointer, line and column, and stores nothing', function (): void {
    $client = EntityApi::existing();

    $response = EntityApi::save($client, "[\n" . SpText::ACS . "\n'hide.from.discovery' => 'yes',\n]");
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(422)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($body['readable'])->toBeTrue()
        ->and($body['errors'])->toHaveCount(1)
        ->and($body['errors'][0]['pointer'])->toBe('/hide.from.discovery')
        ->and($body['errors'][0]['line'])->toBe(3)
        ->and($body['errors'][0]['message'])->toBeString()->not->toBe('')
        ->and(EntityApi::version($client))->toBe(1)
        ->and(EntityPages::count($client, 'console_audit', "action = 'edit'"))->toBe(0);
});

it('says a text that cannot be read is unreadable, with its line and column', function (): void {
    $body = Api::json(EntityApi::save(EntityApi::existing(), "[\n'name' => 'A'\n'scope' => 'b',\n]"));

    expect($body['readable'])->toBeFalse()
        ->and($body['errors'][0]['line'])->toBe(3)
        ->and($body['errors'][0]['column'])->toBeInt();
});

it('rejects a save made on a stale version and answers the entity as it now stands', function (): void {
    $client = EntityApi::existing();
    EntityApi::save($client, "[\n" . SpText::ACS . "\n'name' => 'Theirs',\n]");

    $response = EntityApi::save($client, "[\n" . SpText::ACS . "\n'name' => 'Mine',\n]");
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(409)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($body['php'])->toContain('Theirs')
        ->and($body['php'])->not->toContain('Mine')
        ->and($body['name'])->toBe('Theirs')
        ->and($body['version'])->toBe(2)
        ->and(EntityApi::version($client))->toBe(2);
});

it('answers 404 to an edit of an entity deleted meanwhile', function (): void {
    $client = EntityApi::existing();
    $client->database()->exec('DELETE FROM console_entity');

    expect(EntityApi::save($client, '[' . SpText::ACS . ']')->getStatusCode())->toBe(404);
});

it('saves an entity that has warnings and answers them with the notices of the text', function (): void {
    $client = EntityApi::existing();

    $saved = Api::json(EntityApi::save($client, SpText::endpoints(
        SpText::endpoint('acs'),
        "'sign.logout' => false, 'SingleLogoutServices' => 1,",
    )));

    expect(array_column($saved['warnings'], 'label'))->toContain('Signing off')->toContain('Uses extra')
        ->and($saved['notices'])->toHaveCount(1)
        ->and($saved['notices'][0]['message'])->toContain('Did you mean')
        ->and($saved['notices'][0]['option'])->toBe('SingleLogoutServices')
        ->and($saved['notices'][0]['line'])->toBe(3);
});
