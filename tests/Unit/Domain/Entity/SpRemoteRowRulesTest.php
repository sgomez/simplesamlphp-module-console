<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('rejects two rows that share a name', function (string $option, array $rows, string $pointer): void {
    $document = SpFixtures::document('minimal');
    $document[$option] = $rows;

    expect(array_map(static fn ($e): string => $e->pointer, (new SpRemote())->check($document)))->toBe([$pointer]);
})->with([
    'attributes' => ['attributes', [['name' => 'uid'], ['name' => 'mail'], ['name' => 'uid']], '/attributes/2/name'],
    'attribute encodings' => [
        'attributeencodings',
        [['name' => 'a', 'encoding' => 'raw'], ['name' => 'a', 'encoding' => 'base64']],
        '/attributeencodings/1/name',
    ],
    'entity attributes' => [
        'EntityAttributes',
        [['name' => 'a', 'values' => ['x']], ['name' => 'a', 'values' => ['y']]],
        '/EntityAttributes/1/name',
    ],
    'attributes of a contact' => [
        'contacts',
        [[
            'contactType' => 'other',
            'attributes' => [['name' => 'a', 'value' => '1'], ['name' => 'a', 'value' => '2']],
        ]],
        '/contacts/0/attributes/1/name',
    ],
]);

it('rejects two processing filters with the same priority', function (): void {
    $document = SpFixtures::document('minimal');
    $document['authproc'] = [
        ['priority' => 10, 'filter' => ['class' => 'core:AttributeMap']],
        ['priority' => 20, 'filter' => ['class' => 'core:AttributeLimit']],
        ['priority' => 10, 'filter' => ['class' => 'core:AttributeAdd']],
    ];

    expect(array_map(static fn ($e): string => $e->pointer, (new SpRemote())->check($document)))
        ->toBe(['/authproc/2/priority']);
});

it('rejects the core:PHP filter in either form, whichever way it is given', function (string $filter): void {
    $parsed = SpText::parse("'authproc' => [30 => $filter],");

    expect(SpText::pointers($parsed))->toBe(['/authproc/0/filter/class']);
})->with([
    'short form' => ["['class' => 'core:PHP', 'code' => 'return;']"],
    'short form as a string' => ["'core:PHP'"],
    'full class name' => ["['class' => 'SimpleSAML\\\\Module\\\\core\\\\Auth\\\\Process\\\\PHP']"],
    'full class name with a leading backslash' => ["'\\\\SimpleSAML\\\\Module\\\\core\\\\Auth\\\\Process\\\\PHP'"],
]);

it('accepts another processing filter', function (): void {
    expect(SpText::parse("'authproc' => [30 => 'core:AttributeLimit'],")->errors)->toBe([]);
});
