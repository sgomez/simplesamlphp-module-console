<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Php\PhpExporter;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

it('translates a document into the array its flat file holds', function (string $name): void {
    [, $core] = SpFixtures::flatFile($name);

    expect((new SpRemote())->toCore(SpFixtures::document($name)))->toBe($core);
})->with(SpFixtures::valid());

it('reads the array of a flat file back into the document', function (string $name): void {
    [$entityId, $core] = SpFixtures::flatFile($name);
    $text = PhpExporter::statement($entityId, $core);
    $parsed = (new SpRemote())->fromText($text, null);

    expect($parsed->errors)->toBe([])
        ->and($parsed->document)->toBe(SpFixtures::document($name));
})->with(SpFixtures::valid());

it('is the identity from document to PHP text to document', function (string $name): void {
    $set = new SpRemote();
    $document = SpFixtures::document($name);

    $entityId = 'https://sp.example.org/' . $name;
    $parsed = $set->fromText($set->toText($entityId, $document), $entityId);

    expect($parsed->errors)->toBe([])
        ->and(array_map(static fn ($n): ?string => $n->option, $parsed->notices))
        ->toBe(array_keys((array) ($document['extra'] ?? [])))
        ->and($parsed->document)->toBe($document);
})->with(SpFixtures::valid());

it('writes a document in schema order whatever order it came in', function (): void {
    $document = SpFixtures::document('description');
    $scrambled = array_reverse($document, true);
    $scrambled['AssertionConsumerService'][0] = array_reverse($scrambled['AssertionConsumerService'][0]);

    expect((new SpRemote())->toText('x', $scrambled))->toBe((new SpRemote())->toText('x', $document));
});

it('writes the starter text of a new entity with the required options', function (): void {
    $text = (new SpRemote())->starterText();
    $parsed = (new SpRemote())->fromText($text, null);

    expect($text)->toContain("'AssertionConsumerService'")
        ->and($parsed->errors)->not->toBe([])
        ->and(array_map(static fn ($e): string => $e->pointer, $parsed->errors))
        ->toContain('/AssertionConsumerService/0/Location');
});
