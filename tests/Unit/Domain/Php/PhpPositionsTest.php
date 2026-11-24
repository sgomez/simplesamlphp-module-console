<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\SpText;

const SAML2_CONSTANTS = [
    'BINDING_HTTP_POST', 'BINDING_HTTP_REDIRECT', 'BINDING_HTTP_ARTIFACT', 'BINDING_SOAP', 'BINDING_PAOS',
    'BINDING_HOK_SSO', 'NAMEFORMAT_UNSPECIFIED', 'NAMEFORMAT_URI', 'NAMEFORMAT_BASIC', 'NAMEID_UNSPECIFIED',
    'NAMEID_EMAIL_ADDRESS', 'NAMEID_X509_SUBJECT_NAME', 'NAMEID_KERBEROS', 'NAMEID_ENTITY', 'NAMEID_PERSISTENT',
    'NAMEID_TRANSIENT', 'NAMEID_ENCRYPTED',
];

it('gives each SAML2 constant the value the class has', function (string $name): void {
    $options = SpText::read('[\\SAML2\\Constants::' . $name . ']')->block?->options;

    expect($options)->toBe([constant('SAML2\\Constants::' . $name)]);
})->with(array_combine(SAML2_CONSTANTS, array_map(static fn (string $n): array => [$n], SAML2_CONSTANTS)));

it('reports the column of an error after the opening tag, and on later lines', function (): void {
    $tagged = SpText::read("<?php ['a' => ]")->error;
    $later = SpText::read("[\n    'a' => ]")->error;

    expect($tagged?->column)->toBe(15)
        ->and($later?->line)->toBe(2)
        ->and($later?->column)->toBe(12);
});

it('reports a second block at its own line, and empty text at the start', function (): void {
    $second = SpText::read("[];\n[]")->error;
    $empty = SpText::read('')->error;

    expect($second?->line)->toBe(2)
        ->and($second?->message)->toContain('one block')
        ->and($empty?->line)->toBe(1)
        ->and($empty?->column)->toBe(1);
});

it('numbers the options without a key and remembers the line of each', function (): void {
    $block = SpText::read("[\n  'first',\n  'k' => 'v',\n  'second',\n  7 => 'seven',\n  'eighth',\n]")->block;

    expect($block?->options)->toBe(['first', 'k' => 'v', 1 => 'second', 7 => 'seven', 8 => 'eighth'])
        ->and($block?->lines)->toBe(['0' => 2, 'k' => 3, '1' => 4, '7' => 5, '8' => 6])
        ->and($block?->line)->toBe(1);
});

it('keeps a key that PHP would not turn into an integer as text', function (): void {
    $text = "['0' => 'a', '-5' => 'b', '007' => 'c', '99999999999999999999' => 'd', '1.5' => 'e', 1 => 'f']";

    expect(SpText::read($text)->block?->options)
        ->toBe([0 => 'a', -5 => 'b', '007' => 'c', '99999999999999999999' => 'd', '1.5' => 'e', 1 => 'f']);
});

it('refuses a key of another type and what is not a plain literal', function (string $text, string $message): void {
    $error = SpText::read($text)->error;

    expect($error?->message)->toContain($message);
})->with([
    'a float key' => ['[1.5 => 1]', 'key must be a string or an integer'],
    'a boolean key' => ['[true => 1]', 'key must be a string or an integer'],
    'a negated text' => ["['a' => -'x']", 'literal'],
    'a by-reference value' => ["[&\$x]", 'literal'],
    'a variable class' => ["['a' => \$x::BINDING_SOAP]", 'literal'],
    'a computed constant name' => ["['a' => \\SAML2\\Constants::{'BINDING_SOAP'}]", 'literal'],
]);

it('reads negative floats and zero', function (): void {
    expect(SpText::read('[-1.5, -0, 0]')->block?->options)->toBe([-1.5, 0, 0]);
});
