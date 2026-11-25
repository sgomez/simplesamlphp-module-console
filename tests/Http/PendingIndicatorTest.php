<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('shows Review N changes in the header of a server-rendered screen and the count beside Publish', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://b.example.org');

    $new = $client->page(EntityPages::NEW);

    expect($new)->toContain('Review 2 changes')
        ->and($new)->toMatch('/data-nav="publish"[^>]*>Publish[^<]*<[^>]*>2</');
});

it('shows no Review button when there are no Pending changes', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page(EntityPages::NEW);

    expect($html)->toContain('data-identity')->and($html)->not->toContain('Review ');
});
