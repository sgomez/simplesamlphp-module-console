<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('rejects a value with the form of a Secret reference wherever it is, as not available yet', function (): void {
    $text = SpText::endpoints(
        SpText::endpoint('a'),
        "'name' => ['en' => '%secret(a)%'],\n'authproc' => [['class' => 'core:AttributeAdd', 'x' => ['%secret(b)%']]],",
    );
    $parsed = (new SpRemote())->fromText($text, null);
    $pointers = array_map(static fn ($e): string => $e->pointer, $parsed->errors);

    expect($pointers)->toContain('/name/en')
        ->and($pointers)->toContain('/authproc/0/filter/x/0')
        ->and($parsed->errors[0]->message)->toContain('not available yet')
        ->and($parsed->errors[0]->line)->toBe(3);
});

it('does not take a string that only contains a Secret reference for one', function (): void {
    $parsed = SpText::parse("'name' => ['en' => 'a %secret(a)% b'],");

    expect($parsed->errors)->toBe([]);
});

it('rejects the key slot and the shared key of a stored document, as not available yet', function (): void {
    $document = SpFixtures::document('minimal');
    $document['sharedkey'] = 'k';
    $document['signature_key'] = ['privatekey' => 'k'];

    $errors = (new SpRemote())->check($document);

    expect(array_map(static fn ($e): string => $e->pointer, $errors))->toContain('/sharedkey', '/signature_key');
});
