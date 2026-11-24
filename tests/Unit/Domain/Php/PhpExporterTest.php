<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Php\PhpExporter;

it('writes a statement in the layout of a flat file', function (): void {
    $text = PhpExporter::statement('https://sp.example.org', [
        'name' => ['en' => 'It\'s', 'es' => 'Back\\slash'],
        'ProxyCount' => 3,
        'hide.from.discovery' => false,
        'list' => ['a', 'b'],
        'empty' => [],
    ]);

    expect($text)->toBe(<<<'PHP'
        $metadata['https://sp.example.org'] = [
            'name' => [
                'en' => 'It\'s',
                'es' => 'Back\\slash',
            ],
            'ProxyCount' => 3,
            'hide.from.discovery' => false,
            'list' => [
                'a',
                'b',
            ],
            'empty' => [],
        ];
        PHP);
});

it('omits the keys that PHP would assign itself and keeps the others', function (): void {
    $text = PhpExporter::value(['first', 'second' => ['x'], 5 => 'five', 'six']);

    expect($text)->toBe("[\n    'first',\n    'second' => [\n        'x',\n    ],\n    5 => 'five',\n    'six',\n]");
});

it('writes null, negative numbers and floats', function (): void {
    expect(PhpExporter::value([null, -4, 1.5]))->toBe("[\n    null,\n    -4,\n    1.5,\n]");
});
