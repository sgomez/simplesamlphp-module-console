<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ListFixtures;

it('filters Not live: Unpublished, To be withdrawn and Not live, with the counts of every filter', function (): void {
    $page = Api::get(ListFixtures::client(), '/entities/saml20-sp-remote?filter=not-live');

    expect(array_column($page['rows'], 'entityId'))->toBe([
        'https://new.example.org',
        'https://off.example.org',
        'https://withdrawn.example.org',
        'my-sp',
    ])->and($page['filter'])->toBe('not-live')
        ->and($page['total'])->toBe(4)
        ->and($page['pages'])->toBe(1)
        ->and($page['counts'])->toBe(['all' => 6, 'not-live' => 4, 'warnings' => 2]);
});

it('filters the rows with warnings', function (): void {
    $page = Api::get(ListFixtures::client(), '/entities/saml20-sp-remote?filter=warnings');

    expect(array_column($page['rows'], 'entityId'))->toBe(['https://modified.example.org', 'my-sp'])
        ->and($page['filter'])->toBe('warnings')
        ->and($page['total'])->toBe(2);
});

it('lists every row, by name, for no filter or one it does not know', function (): void {
    $client = ListFixtures::client();

    $unknown = Api::get($client, '/entities/saml20-sp-remote?filter=bogus');

    expect($unknown['filter'])->toBe('all')
        ->and($unknown['total'])->toBe(6)
        ->and(array_column($unknown['rows'], 'entityId'))->toBe([
            'https://modified.example.org',
            'https://new.example.org',
            'https://off.example.org',
            'https://withdrawn.example.org',
            'https://live.example.org',
            'my-sp',
        ])
        ->and(Api::get($client, '/entities/saml20-sp-remote')['rows'])->toBe($unknown['rows']);
});

it('counts the filters among the rows the search matches', function (): void {
    $page = Api::get(ListFixtures::client(), '/entities/saml20-sp-remote?q=f&filter=not-live');

    expect(array_column($page['rows'], 'entityId'))->toBe(['https://off.example.org'])
        ->and($page['counts'])->toBe(['all' => 2, 'not-live' => 1, 'warnings' => 1])
        ->and($page['query'])->toBe('f');
});
