<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\ListFilter;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Tests\Support\ListedEntities as L;
use SimpleSAML\Module\console\Tests\Support\ListFixtures as F;

it('orders by name ignoring case, by entity ID where there is none, then by entity ID', function (): void {
    $list = L::listedPage(
        L::listedSp('https://z.example.org', ['en' => 'alpha']),
        L::listedSp('https://b.example.org', ['es' => 'Ñu', 'en' => 'Beta']),
        L::listedSp('https://c.example.org'),
        L::listedSp('https://a.example.org', ['en' => 'Alpha']),
        L::listedSp('https://y.example.org', ['es' => 'Gamma']),
        L::listedSp('10'),
        L::listedSp('9'),
    );

    expect(L::listedIds($list->page('saml20-sp-remote', '', 1)->rows))->toBe([
        '10',
        '9',
        'https://a.example.org',
        'https://z.example.org',
        'https://b.example.org',
        'https://y.example.org',
        'https://c.example.org',
    ]);
});

it('pages in that order', function (): void {
    $entities = array_map(
        static fn (int $i): StoredEntity
            => L::listedSp(sprintf('https://%02d.example.org', $i), ['en' => 'N' . (99 - $i)]),
        range(1, 13),
    );

    $second = L::listedPage(...$entities)->page('saml20-sp-remote', '', 2);

    expect(L::listedIds($second->rows))->toBe(['https://01.example.org']);
});

it('filters Not live: Unpublished, and disabled whether published or not', function (): void {
    [$list, $states] = F::filtered();

    $page = $list->page('saml20-sp-remote', '', 1, ListFilter::NotLive, $states);

    expect(L::listedIds($page->rows))->toBe(['https://new.example.org', 'https://off.example.org'])
        ->and($page->total)->toBe(2)
        ->and($page->filter)->toBe(ListFilter::NotLive);
});

it('filters the rows with warnings, never an Unreadable one', function (): void {
    [$list, $states] = F::filtered();

    $page = $list->page('saml20-sp-remote', '', 1, ListFilter::WithWarnings, $states);

    expect(L::listedIds($page->rows))->toBe(['https://modified.example.org', 'https://off.example.org']);
});

it('counts the rows of every filter among those the search matches', function (): void {
    [$list, $states] = F::filtered();

    $all = $list->page('saml20-sp-remote', '', 1, ListFilter::All, $states);
    $searched = $list->page('saml20-sp-remote', 'i', 1, ListFilter::All, $states);
    $narrow = $list->page('saml20-sp-remote', 'off', 1, ListFilter::All, $states);

    expect($all->counts)->toBe(['all' => 6, 'not-live' => 2, 'warnings' => 2])
        ->and($all->total)->toBe(6)
        ->and($all->filter)->toBe(ListFilter::All)
        ->and($searched->counts)->toBe(['all' => 2, 'not-live' => 0, 'warnings' => 1])
        ->and($narrow->counts)->toBe(['all' => 1, 'not-live' => 1, 'warnings' => 1]);
});

it('lists every row by default and, without states, counts only disabled rows as Not live', function (): void {
    [$list] = F::filtered();

    $page = $list->page('saml20-sp-remote', '', 1);

    expect($page->filter)->toBe(ListFilter::All)
        ->and($page->total)->toBe(6)
        ->and($page->counts['not-live'])->toBe(1);
});
