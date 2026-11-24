<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('shows the warnings of an entity on its edit screen, apart from the errors', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'my-sp', ['extra' => ['consent.disable' => true], 'sign.logout' => false]);

    $html = $client->page('/entities/saml20-sp-remote/edit?entityid=my-sp');

    expect($html)->toContain('data-warnings')
        ->and($html)->toContain('The entity ID is not an absolute URI.')
        ->and($html)->toContain('Uses extra')
        ->and($html)->toContain('Signing off')
        ->and($html)->not->toContain('data-errors');
});

it('shows no warnings block for a sound entity', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://sp.example.org');

    expect($client->page('/entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fsp.example.org'))
        ->not->toContain('data-warnings');
});

it('saves an entity that has warnings and shows them on the screen it redirects to', function (): void {
    [$client, $html] = EntityPages::opened();

    $response = EntityPages::submitNew($client, $html, 'my-sp', SpText::endpoints(
        SpText::endpoint('acs'),
        "'sign.logout' => false, 'SingleLogoutServices' => 1,",
    ));
    $screen = $client->page('/entities/saml20-sp-remote/edit?entityid=my-sp');

    expect($response->getStatusCode())->toBe(302)
        ->and($screen)->toContain('data-warnings')
        ->and($screen)->toContain('Signing off')
        ->and($screen)->toContain('Entity ID not a URI')
        ->and($screen)->toContain('Uses extra')
        ->and($screen)->toContain('Did you mean');
});
