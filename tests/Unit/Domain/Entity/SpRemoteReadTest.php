<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('takes the entity ID from the block and checks it against the expected one', function (): void {
    $text = "\$metadata['https://a.example.org'] = [" . SpText::ACS . '];';
    $set = new SpRemote();

    expect($set->fromText($text, null)->entityId)->toBe('https://a.example.org')
        ->and($set->fromText($text, 'https://a.example.org')->errors)->toBe([])
        ->and(SpText::pointers($set->fromText($text, 'https://b.example.org')))->toBe(['']);
});

it('drops entityid, metadata-set, metadata-index and url, and reports expire', function (): void {
    $parsed = SpText::parse("'entityid' => 'https://a.example.org', 'metadata-set' => 'saml20-sp-remote',"
        . " 'metadata-index' => 'x',"
        . " 'url' => 'https://a.example.org/u', 'expire' => 1795515300,", 'https://a.example.org');

    expect($parsed->errors)->toBe([])
        ->and(array_keys((array) $parsed->document))->toBe(['AssertionConsumerService'])
        ->and(array_map(static fn ($n): string => $n->message, $parsed->notices))->toHaveCount(1)
        ->and($parsed->notices[0]->message)->toContain('expire');
});

it('rejects an entityid inside the block that differs from the entity', function (): void {
    $parsed = SpText::parse("'entityid' => 'https://other.example.org',", 'https://a.example.org');

    expect(SpText::pointers($parsed))->toBe(['']);
});

it('rejects the options of the groups that are not available yet, at their line', function (): void {
    $parsed = SpText::parse(
        "'attributes' => ['uid'],\n'NameIDFormat' => ['x'],\n"
        . "'signature_key' => ['privatekey' => 'k'],\n'authproc' => [],",
    );
    $lines = array_map(static fn ($e): ?int => $e->line, $parsed->errors);

    expect(SpText::pointers($parsed))->toBe(['/attributes', '/NameIDFormat', '/signature_key'])
        ->and($parsed->errors[0]->message)->toContain('not available yet')
        ->and($lines)->toBe([3, 4, 5]);
});

it('moves an uncataloged option to extra with a notice and a suggestion', function (): void {
    $parsed = SpText::parse("'SingleLogoutServices' => [], 'consent.disable' => true, 'ssl.x' => ['a' => 1],");

    expect($parsed->errors)->toBe([])
        ->and($parsed->document['extra'] ?? null)->toBe(['consent.disable' => true, 'ssl.x' => ['a' => 1]])
        ->and(implode(' ', array_map(static fn ($n): string => $n->message, $parsed->notices)))
        ->toContain('consent.disable')
        ->and($parsed->notices[0]->line)->toBe(3);
});

it('suggests the cataloged option an uncataloged name is close to', function (): void {
    $parsed = SpText::parse("'SingleLogoutServic' => [['Location' => 'https://a.example.org/slo']],");

    expect($parsed->notices[0]->message)->toContain('SingleLogoutService');
});
