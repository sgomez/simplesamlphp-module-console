<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures as P;

it('shows Review N changes in the header of every screen and the count beside Publish', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');
    P::seed($client, 'https://b.example.org');

    $list = $client->page(EntityPages::LIST);
    $new = $client->page(EntityPages::NEW);

    expect($list)->toContain('Review 2 changes')
        ->and($new)->toContain('Review 2 changes')
        ->and($list)->toMatch('/data-nav="publish"[^>]*>Publish[^<]*<[^>]*>2</');
});

it('shows no Review button when there are no Pending changes', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page(EntityPages::LIST);

    expect($html)->not->toContain('Review ');
});

it('shows the state of each entity in the list', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    expect($client->page(EntityPages::LIST))->toContain('Unpublished');
});

it('says there is nothing to publish, and offers no Publish button', function (): void {
    $html = (new ConsoleClient())->loginAsAdmin()->page(P::PATH);

    expect($html)->toContain('Nothing to publish')
        ->and($html)->not->toContain('name="hash"');
});

it('lists the Pending changes by state with the next number, a comment field and the button', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://a.example.org');

    $html = $client->page(P::PATH);

    expect($html)->toContain('Unpublished')
        ->and($html)->toContain('https://a.example.org')
        ->and($html)->toContain('Snapshot 1')
        ->and($html)->toContain('name="comment"')
        ->and(EntityPages::field($html, 'hash'))->toMatch('/^[0-9a-f]{64}$/')
        ->and($html)->not->toContain('Review 1 change');
});

it('lists the blocking problems first, each naming its entity, and offers no Publish', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    P::seed($client, 'https://bad.example.org', ['AssertionConsumerService' => [['Binding' => 'urn:a:b']]]);
    $client->database()->exec(
        "INSERT INTO console_entity VALUES ('saml20-sp-remote', 'https://broken.example.org', 1, '{oops', 1, NULL, "
        . "'x', 'x')",
    );

    $html = $client->page(P::PATH);

    expect($html)->toContain('https://bad.example.org')
        ->and($html)->toContain('https://broken.example.org')
        ->and($html)->toContain('not valid JSON')
        ->and(strpos($html, 'data-problems'))->toBeLessThan((int) strpos($html, 'data-pending>'))
        ->and($html)->not->toContain('name="hash"');
});
