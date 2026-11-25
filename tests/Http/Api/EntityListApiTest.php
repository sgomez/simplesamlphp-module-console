<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

const API_LIST = '/entities/saml20-sp-remote';

it('lists the managed service providers with name, entity ID and state, by name or entity ID', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://b.example.org', ['name' => ['en' => 'Beta service']]);
    EntityDb::seed($client, 'https://a.example.org');

    $page = Api::get($client, API_LIST);

    expect($page['rows'])->toBe([
        [
            'entityId' => 'https://b.example.org',
            'name' => 'Beta service',
            'state' => 'Unpublished',
            'labels' => [],
            'unreadable' => false,
            'error' => null,
        ],
        [
            'entityId' => 'https://a.example.org',
            'name' => null,
            'state' => 'Unpublished',
            'labels' => [],
            'unreadable' => false,
            'error' => null,
        ],
    ])->and($page['total'])->toBe(2)
        ->and($page['page'])->toBe(1)
        ->and($page['pages'])->toBe(1)
        ->and($page['perPage'])->toBe(12)
        ->and($page['query'])->toBe('')
        ->and($page['filter'])->toBe('all')
        ->and($page['counts'])->toBe(['all' => 2, 'not-live' => 2, 'warnings' => 0]);
});

it('answers an empty page when there are no service providers', function (): void {
    $page = Api::get((new ConsoleClient())->loginAsAdmin(), API_LIST);

    expect($page['rows'])->toBe([])->and($page['total'])->toBe(0)->and($page['pages'])->toBe(1);
});

it('searches by entity ID and by name', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    EntityDb::seed($client, 'https://one.example.org', ['name' => ['en' => 'Library']]);
    EntityDb::seed($client, 'https://two.example.org', ['name' => ['es' => 'Biblioteca']]);
    EntityDb::seed($client, 'https://three.example.org');

    $byId = Api::get($client, API_LIST . '?q=TWO.example');
    $byName = Api::get($client, API_LIST . '?q=biblio');

    expect(array_column($byId['rows'], 'entityId'))->toBe(['https://two.example.org'])
        ->and(array_column($byName['rows'], 'entityId'))->toBe(['https://two.example.org'])
        ->and($byName['total'])->toBe(1)
        ->and($byName['query'])->toBe('biblio');
});

it('paginates on the server and answers the total', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    foreach (range(1, 30) as $n) {
        EntityDb::seed($client, sprintf('https://sp%02d.example.org', $n));
    }

    $first = Api::get($client, API_LIST);
    $second = Api::get($client, API_LIST . '?page=2');

    expect(array_column($first['rows'], 'entityId'))->toHaveCount(12)->toContain('https://sp01.example.org')
        ->and($first['total'])->toBe(30)
        ->and($first['pages'])->toBe(3)
        ->and(array_column($second['rows'], 'entityId'))->toHaveCount(12)->toContain('https://sp13.example.org')
        ->and($second['page'])->toBe(2)
        ->and(Api::get($client, API_LIST . '?page=99')['page'])->toBe(3);
});

it('passes through the gate', function (): void {
    expect((new ConsoleClient())->api('GET', API_LIST)->getStatusCode())->toBe(401)
        ->and((new ConsoleClient())->withDatabase(null)->loginAsAdmin()->api('GET', API_LIST)->getStatusCode())
        ->toBe(503);
});
