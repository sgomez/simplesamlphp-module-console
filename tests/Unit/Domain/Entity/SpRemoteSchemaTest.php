<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('accepts every valid fixture', function (string $name): void {
    expect(SpText::schemaErrors(SpFixtures::document($name)))->toBe([]);
})->with(SpFixtures::valid());

it('rejects every invalid fixture at the pointer it names', function (string $pointer, array $document): void {
    $pointers = array_map(static fn ($error): string => $error->pointer, SpText::schemaErrors($document));

    expect($pointers)->toContain($pointer);
})->with(SpFixtures::invalid());

it('reports every error at once, not only the first', function (): void {
    $errors = SpText::schemaErrors([
        'AssertionConsumerService' => [['Binding' => 'x y', 'Location' => 'ftp://a']],
        'hide.from.discovery' => 'yes',
        'contacts' => [['contactType' => 'boss']],
    ]);
    $pointers = array_map(static fn ($error): string => $error->pointer, $errors);

    expect($pointers)->toContain('/AssertionConsumerService/0/Binding')
        ->and($pointers)->toContain('/AssertionConsumerService/0/Location')
        ->and($pointers)->toContain('/hide.from.discovery')
        ->and($pointers)->toContain('/contacts/0/contactType');
});

it('uses the message the schema gives to a pattern', function (): void {
    $errors = SpText::schemaErrors(['AssertionConsumerService' => [['Binding' => 'urn:a:b', 'Location' => 'ftp://a']]]);

    expect(array_map(static fn ($error): string => $error->message, $errors))
        ->toContain('An absolute http or https URL.');
});

it('never writes a default into the document', function (): void {
    $document = ['AssertionConsumerService' => [['Binding' => 'urn:a:b', 'Location' => 'https://a.example.org']]];

    SpText::schemaErrors($document);

    expect($document)->not->toHaveKey('hide.from.discovery');
});

it('rejects an option the schema does not catalog', function (): void {
    $pointers = array_map(static fn ($error): string => $error->pointer, SpText::schemaErrors(
        SpFixtures::document('minimal') + ['bogus' => 1],
    ));

    expect($pointers)->toContain('');
});
