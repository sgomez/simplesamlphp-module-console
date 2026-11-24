<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\DocumentOrder;
use SimpleSAML\Module\console\Domain\Entity\SchemaCatalog;
use SimpleSAML\Module\console\Domain\Entity\SchemaSplitter;

it('moves the keywords next to a $ref into their own branch and leaves annotations in place', function (): void {
    $split = SchemaSplitter::split([
        'title' => 'T',
        'x-widget' => 'w',
        '$ref' => '#/a',
        'minItems' => 1,
        'items' => ['$ref' => '#/b', 'maxItems' => 2, 'description' => 'D'],
    ]);

    expect($split)->toBe([
        'title' => 'T',
        'x-widget' => 'w',
        'allOf' => [
            ['$ref' => '#/a'],
            ['minItems' => 1, 'items' => ['description' => 'D', 'allOf' => [['$ref' => '#/b'], ['maxItems' => 2]]]],
        ],
    ]);
});

it('leaves a $ref that stands alone, and everything else, as it is', function (): void {
    $node = ['properties' => ['a' => ['$ref' => '#/a', 'default' => 1]], 'enum' => ['x', '$ref'], 'n' => 3];

    expect(SchemaSplitter::split($node))->toBe($node)
        ->and(SchemaSplitter::split('text'))->toBe('text');
});

it('names the schema of a set and the options it catalogs, without extra', function (): void {
    $catalog = new SchemaCatalog();
    $options = $catalog->options('saml20-sp-remote');

    expect($catalog->uri('saml20-sp-remote'))->toBe('https://console.invalid/schemas/entities/saml20-sp-remote.json')
        ->and($options)->toHaveCount(45)
        ->and($options[0])->toBe('AssertionConsumerService')
        ->and($options)->not->toContain('extra')
        ->and($catalog->common())->toHaveKey('$defs')
        ->and(is_dir($catalog->directory()))->toBeTrue();
});

it('orders the objects of a document by the schema and keeps what it does not know after', function (): void {
    $order = new DocumentOrder(new SchemaCatalog(), 'saml20-sp-remote');

    $ordered = $order->order([
        'extra' => ['z' => 1, 'a' => 2],
        'contacts' => [['givenName' => 'G', 'contactType' => 'other']],
        'name' => ['es' => 'E', 'en' => 'N'],
        'AssertionConsumerService' => [['Location' => 'https://a.example.org', 'Binding' => 'urn:a:b', 'x' => 1]],
    ]);

    expect(array_keys($ordered))->toBe(['AssertionConsumerService', 'name', 'contacts', 'extra'])
        ->and(array_keys($ordered['AssertionConsumerService'][0]))->toBe(['Binding', 'Location', 'x'])
        ->and(array_keys($ordered['contacts'][0]))->toBe(['contactType', 'givenName'])
        ->and(array_keys($ordered['name']))->toBe(['es', 'en'])
        ->and(array_keys($ordered['extra']))->toBe(['z', 'a']);
});
