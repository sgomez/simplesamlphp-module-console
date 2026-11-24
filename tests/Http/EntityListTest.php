<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

const LIST_PATH = '/entities/saml20-sp-remote';

it('redirects the front page to the list of service providers', function (): void {
    $response = (new ConsoleClient())->loginAsAdmin()->get('/');

    expect($response->getStatusCode())->toBe(302)
        ->and($response->headers->get('Location'))->toBe(ConsoleClient::BASE . LIST_PATH);
});

it('holds Service providers and Publish only in the sidebar', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page(LIST_PATH);

    preg_match_all('/data-nav="([a-z-]+)"/', $html, $entries);

    expect($entries[1])->toBe(['service-providers', 'publish'])
        ->and($html)->toContain('Service providers')
        ->and($html)->toContain('module.php/console/publish');
});

it('lists the managed service providers with name, entity ID and a link to each', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://b.example.org', ['name' => ['en' => 'Beta service']]);
    EntityDb::seed($client, 'https://a.example.org');

    $html = $client->page(LIST_PATH);

    expect($html)->toContain('Beta service')
        ->and($html)->toContain('https://b.example.org')
        ->and(strpos($html, 'https://a.example.org'))->toBeLessThan((int) strpos($html, 'https://b.example.org'))
        ->and($html)->toContain('entities/saml20-sp-remote/edit?entityid=https%3A%2F%2Fb.example.org')
        ->and($html)->toContain('entities/saml20-sp-remote/new');
});

it('says so when there are no service providers', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page(LIST_PATH);

    expect($html)->toContain('No service providers yet');
});

it('lists a row that cannot be loaded as Unreadable, with its load error', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    $client->database()->exec(
        "INSERT INTO console_entity VALUES ('saml20-sp-remote', 'https://bad.example.org', 1, '{oops', 1, NULL, "
        . "'x', 'x')",
    );

    $html = $client->page(LIST_PATH);

    expect($html)->toContain('https://bad.example.org')
        ->and($html)->toContain('Unreadable')
        ->and($html)->toContain('not valid JSON');
});

it('searches by entity ID and by name', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://one.example.org', ['name' => ['en' => 'Library']]);
    EntityDb::seed($client, 'https://two.example.org', ['name' => ['es' => 'Biblioteca']]);
    EntityDb::seed($client, 'https://three.example.org');

    $byId = $client->page(LIST_PATH . '?q=TWO.example');
    $byName = $client->page(LIST_PATH . '?q=biblio');

    expect($byId)->toContain('https://two.example.org')->not->toContain('https://one.example.org')
        ->and($byName)->toContain('https://two.example.org')->not->toContain('https://three.example.org')
        ->and($byName)->toContain('1 service provider');
});

it('paginates on the server and shows the total', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    foreach (range(1, 30) as $n) {
        EntityDb::seed($client, sprintf('https://sp%02d.example.org', $n));
    }

    $first = $client->page(LIST_PATH);
    $second = $client->page(LIST_PATH . '?page=2');

    expect($first)->toContain('sp01.example.org')->not->toContain('sp26.example.org')
        ->and($first)->toContain('30 service providers')
        ->and($second)->toContain('sp26.example.org')->not->toContain('sp01.example.org')
        ->and($client->page(LIST_PATH . '?page=99'))->toContain('sp26.example.org');
});

it('has no route for the sets that are not managed yet, which core answers with a 404', function (string $set): void {
    $client = (new ConsoleClient())->loginAsAdmin();

    expect(fn () => $client->get('/entities/' . $set))->toThrow(SimpleSAML\Error\NotFound::class);
})->with(['saml20-idp-remote', 'saml20-idp-hosted', 'nonsense']);

it('answers with the state page when the database is not ready', function (): void {
    $html = (new ConsoleClient())->withDatabase(null)->loginAsAdmin()->page(LIST_PATH);

    expect($html)->toContain('data-state="pending-migrations"');
});
