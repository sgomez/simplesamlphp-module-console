<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('answers the errors a save would give, located, and saves nothing', function (): void {
    $client = EntityApi::existing();

    $response = EntityApi::validate($client, "[\n" . SpText::ACS . "\n'hide.from.discovery' => 'yes',\n]");
    $body = Api::json($response);

    expect($response->getStatusCode())->toBe(200)
        ->and(EntityApi::noStore($response))->toBeTrue()
        ->and($body['readable'])->toBeTrue()
        ->and(array_column($body['errors'], 'pointer'))->toBe(['/hide.from.discovery'])
        ->and($body['errors'][0]['line'])->toBe(3)
        ->and(EntityApi::version($client))->toBe(1)
        ->and(EntityPages::count($client, 'console_audit', "action = 'edit'"))->toBe(0);
});

it('answers the warnings and the notices of a valid text, and saves nothing', function (): void {
    $client = EntityApi::existing();

    $body = Api::json(EntityApi::validate($client, SpText::endpoints(
        SpText::endpoint('acs'),
        "'sign.logout' => false, 'SingleLogoutServices' => 1,",
    )));

    expect($body['errors'])->toBe([])
        ->and(array_column($body['warnings'], 'label'))->toContain('Signing off')->toContain('Uses extra')
        ->and($body['notices'][0]['message'])->toContain('Did you mean')
        ->and($body['notices'][0]['line'])->toBe(3)
        ->and(EntityApi::version($client))->toBe(1);
});

it('rejects a block whose entity ID is not the one edited', function (): void {
    $body = Api::json(EntityApi::validate(
        EntityApi::existing(),
        "\$metadata['https://other.example.org'] = [" . SpText::ACS . '];',
    ));

    expect($body['errors'])->toHaveCount(1)->and($body['errors'][0]['line'])->toBe(1);
});

it('says a text that cannot be read is unreadable and checks nothing else', function (): void {
    $body = Api::json(EntityApi::validate(EntityApi::existing(), "[\n'name' => 'A'\n'scope' => 'b',\n]"));

    expect($body['readable'])->toBeFalse()
        ->and($body['errors'])->toHaveCount(1)
        ->and($body['errors'][0]['line'])->toBe(3)
        ->and($body['warnings'])->toBe([]);
});

it('checks the entity ID rules of a new entity, whose ID comes from the text', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();

    $body = Api::json(EntityApi::validate($client, '[' . SpText::ACS . ']', ''));

    expect(array_column($body['errors'], 'message'))->toContain('The entity ID is required.');
});

it('passes through the gate', function (): void {
    expect((new ConsoleClient())->api('POST', EntityApi::VALIDATE)->getStatusCode())->toBe(401);
});
