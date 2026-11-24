<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Tests\Support\PublicationChecking as C;
use SimpleSAML\Module\console\Tests\Support\PublicationFixtures as F;

it('names the load error of an Unreadable row', function (): void {
    $problems = C::checksResolving()->problems([F::entity('https://bad.example.org', error: 'Syntax error')], '', null);

    expect(C::problemsOf($problems))->toBe([['https://bad.example.org', 'The row cannot be loaded: Syntax error']]);
});

it('prefixes a schema error with its pointer, except one about the whole document', function (): void {
    $document = ['AssertionConsumerService' => [['Binding' => 'urn:a:b']]];
    $rootless = F::entity('x', ['name' => ['en' => 'x']]);

    $messages = array_column(C::problemsOf(C::checksResolving()->problems([F::entity('x', $document)], '', null)), 1);

    expect($messages)->not->toBe([])
        ->and($messages[0])->toStartWith('/AssertionConsumerService/0: ')
        ->and(array_column(C::problemsOf(C::checksResolving()->problems([$rootless], '', null)), 1))
        ->toBe(['The required properties (AssertionConsumerService) are missing']);
});

it('skips a disabled entity', function (): void {
    $disabled = new StoredEntity('saml20-sp-remote', 'x', false, 1, null, 'broken');

    expect(C::checksResolving()->problems([$disabled], '', null))->toBe([]);
});

it('names each processing filter class that does not resolve, and tolerates malformed rows', function (): void {
    $authproc = [
        ['priority' => 10, 'filter' => ['class' => 'core:AttributeMap']],
        ['priority' => 20, 'filter' => ['class' => 'nope:Missing']],
        'not a row',
        ['priority' => 30, 'filter' => 'not a filter'],
    ];
    $entity = F::entity('https://a.example.org', F::entity('x')->document + ['authproc' => $authproc]);

    $messages = array_column(C::problemsOf(C::checksResolving('core:AttributeMap')->problems([$entity], '', null)), 1);

    expect($messages)->toContain('The processing filter class nope:Missing does not resolve on this node.')
        ->and(array_filter($messages, static fn (string $m): bool => str_contains($m, 'core:AttributeMap')))->toBe([]);
});

it('tolerates processing filters that are not a list', function (): void {
    $entity = F::entity('https://a.example.org', F::entity('x')->document + ['authproc' => 'oops']);

    expect(fn () => C::checksResolving()->problems([$entity], '', null))->not->toThrow(Throwable::class);
});

it('blocks a Snapshot larger than max_allowed_packet minus 1 MiB, and not one that fits exactly', function (): void {
    $limit = 1048576 + 10;

    expect(C::checksResolving()->problems([], str_repeat('a', 10), $limit))->toBe([])
        ->and(C::checksResolving()->problems([], str_repeat('a', 10), null))->toBe([])
        ->and(C::problemsOf(C::checksResolving()->problems([], str_repeat('a', 11), $limit)))->toBe([[
            null,
            'The Snapshot takes 11 bytes, more than the database accepts: max_allowed_packet (1048586 bytes) minus '
            . '1 MiB. Raise max_allowed_packet.',
        ]]);
});
