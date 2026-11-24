<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\SpText;

it('reads a block with its wrapper', function (): void {
    $text = "\$metadata['https://sp.example.org'] = [\n    'ProxyCount' => 2,\n    'name' => ['en' => 'X'],\n];";
    $block = SpText::read($text)->block;

    expect($block?->entityId)->toBe('https://sp.example.org')
        ->and($block?->options)->toBe(['ProxyCount' => 2, 'name' => ['en' => 'X']])
        ->and($block?->lines)->toBe(['ProxyCount' => 2, 'name' => 3]);
});

it('reads a bare array, with or without the semicolon and the opening tag', function (string $text): void {
    $block = SpText::read($text)->block;

    expect($block?->entityId)->toBeNull()
        ->and($block?->options)->toBe(['ProxyCount' => 2]);
})->with([
    'bare' => ["['ProxyCount' => 2]"],
    'semicolon' => ["['ProxyCount' => 2];"],
    'tag' => ["<?php\n\n['ProxyCount' => 2];"],
    'array()' => ["array('ProxyCount' => 2)"],
    'comment' => ["['ProxyCount' => 2] // done"],
]);

it('reads literals, negative numbers, booleans and the SAML constants', function (): void {
    $text = "[\n'a' => true, 'b' => FALSE, 'c' => null, 'd' => -3, 'e' => 1.5,"
        . " 'f' => \\SAML2\\Constants::BINDING_HTTP_POST,\n"
        . "'g' => SAML2\\Constants::NAMEID_TRANSIENT, 'h' => \"x\", '12' => 'k', 'positional',\n]";

    expect(SpText::read($text)->block?->options)->toBe([
        'a' => true, 'b' => false, 'c' => null, 'd' => -3, 'e' => 1.5,
        'f' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        'g' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
        'h' => 'x', 12 => 'k', 13 => 'positional',
    ]);
});

it('reports a syntax error with its line and column', function (): void {
    $error = SpText::read("['a' => 1,\n  'b' => ,\n]")->error;

    expect($error?->line)->toBe(2)
        ->and($error?->column)->toBe(10);
});

it('reports a column on the first line without counting the added opening tag', function (): void {
    $error = SpText::read("['a' => ]")->error;

    expect($error?->line)->toBe(1)
        ->and($error?->column)->toBe(9);
});

it('refuses what is not a literal, without executing it', function (string $text, int $line, int $column): void {
    $error = SpText::read($text)->error;

    expect($error?->line)->toBe($line)
        ->and($error?->column)->toBe($column)
        ->and($error?->message)->toContain('literal');
})->with([
    'function call' => ["[\n 'a' => phpinfo(),\n]", 2, 9],
    'concatenation' => ["['a' => 'x' . 'y']", 1, 9],
    'variable' => ["['a' => \$x]", 1, 9],
    'constant' => ["['a' => PHP_VERSION]", 1, 9],
    'class constant outside the list' => ["['a' => \\SAML2\\Constants::NOPE]", 1, 9],
    'other class' => ["['a' => Foo::BAR]", 1, 9],
    'spread' => ["[...\$x]", 1, 2],
    'interpolation' => ['["a" => "x$y"]', 1, 9],
]);

it('refuses more than one block and anything but a block', function (string $text): void {
    expect(SpText::read($text)->error)->not->toBeNull();
})->with([
    'two blocks' => ["\$metadata['a'] = [];\n\$metadata['b'] = [];"],
    'a function call' => ['phpinfo();'],
    'a wrong variable' => ["\$other['a'] = [];"],
    'an echo' => ["echo 'x';"],
    'a scalar' => ["'x'"],
    'empty' => [''],
    'a computed key' => ["\$metadata[\$x] = [];"],
]);
