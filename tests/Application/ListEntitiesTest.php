<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Tests\Support\ListedEntities as L;

it('lists every entity of the set on one page when nothing is searched', function (): void {
    $list = L::listedPage(L::listedSp('https://a.example.org'), L::listedSp('https://b.example.org'));
    $page = $list->page('saml20-sp-remote', '  ', 1);

    expect(L::listedIds($page->rows))->toBe(['https://a.example.org', 'https://b.example.org'])
        ->and($page->total)->toBe(2)
        ->and($page->page)->toBe(1)
        ->and($page->pages)->toBe(1)
        ->and($page->query)->toBe('');
});

it('finds by entity ID or by any name, ignoring case and surrounding spaces', function (): void {
    $list = L::listedPage(
        L::listedSp('https://a.example.org'),
        L::listedSp('https://b.example.org', ['en' => 'Library', 'es' => 'Biblioteca']),
        L::listedSp('https://c.example.org', ['en' => 42, 'es' => 'Campus']),
        L::listedSp('https://d.example.org', 'Library'),
    );

    expect(L::listedIds(L::listedPage()->page('saml20-sp-remote', 'x', 1)->rows))->toBe([])
        ->and(L::listedIds($list->page('saml20-sp-remote', ' B.EXAMPLE ', 1)->rows))->toBe(['https://b.example.org'])
        ->and($list->page('saml20-sp-remote', ' B.EXAMPLE ', 1)->query)->toBe('B.EXAMPLE')
        ->and(L::listedIds($list->page('saml20-sp-remote', 'biblio', 1)->rows))->toBe(['https://b.example.org'])
        ->and(L::listedIds($list->page('saml20-sp-remote', 'campus', 1)->rows))->toBe(['https://c.example.org'])
        ->and(L::listedIds($list->page('saml20-sp-remote', '42', 1)->rows))->toBe([])
        ->and(L::listedIds($list->page('saml20-sp-remote', 'library', 1)->rows))->toBe(['https://b.example.org']);
});

it('pages by 12 and keeps the page asked for within the pages there are', function (): void {
    $entities = array_map(
        static fn (int $i): StoredEntity => L::listedSp(sprintf('https://%02d.example.org', $i)),
        range(1, 37),
    );
    $list = L::listedPage(...$entities);

    $second = $list->page('saml20-sp-remote', '', 2);
    $last = $list->page('saml20-sp-remote', '', 9);
    $first = $list->page('saml20-sp-remote', '', 0);

    expect($second->pages)->toBe(4)
        ->and($second->total)->toBe(37)
        ->and(L::listedIds($second->rows))->toHaveCount(12)
        ->and($second->rows[0]->entityId)->toBe('https://13.example.org')
        ->and($last->page)->toBe(4)
        ->and(L::listedIds($last->rows))->toBe(['https://37.example.org'])
        ->and($first->page)->toBe(1)
        ->and($first->rows[0]->entityId)->toBe('https://01.example.org')
        ->and(L::listedPage(...array_slice($entities, 0, 12))->page('saml20-sp-remote', '', 2)->pages)->toBe(1)
        ->and(L::listedPage()->page('saml20-sp-remote', '', 1)->pages)->toBe(1);
});
