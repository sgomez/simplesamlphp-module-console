<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
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

it('labels the entities of the list with their warnings, styled apart from errors', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'my-sp', ['saml20.sign.response' => false]);
    EntityDb::seed($client, 'https://sp.example.org');

    $html = $client->page('/entities/saml20-sp-remote');
    $sound = substr($html, (int) strpos($html, 'data-entity="https://sp.example.org"'));

    expect($html)->toContain('status s-warn')
        ->and($html)->toContain('Signing off')
        ->and($html)->toContain('Entity ID not a URI')
        ->and($html)->not->toContain('s-danger')
        ->and(substr($sound, 0, (int) strpos($sound, '</a>')))->not->toContain('warning');
});

it('flags a certificate within the configured days of expiring', function (): void {
    $client = (new ConsoleClient())->withModuleConfig(['cert_expiry_warning_days' => 4000])->loginAsAdmin();
    EntityDb::seed($client, 'https://sp.example.org', [
        'certificates' => [['pem' => SpFixtures::pem(), 'use' => 'both']],
    ]);

    expect($client->page('/entities/saml20-sp-remote'))->toContain('Certificate expiring');
});

it('does not flag a certificate far from expiring with the default days', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://sp.example.org', [
        'certificates' => [['pem' => SpFixtures::pem(), 'use' => 'both']],
    ]);

    expect($client->page('/entities/saml20-sp-remote'))->not->toContain('Certificate expiring');
});
