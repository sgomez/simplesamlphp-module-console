<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\EntityIdRules;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('rejects two endpoints of a service with the same index', function (): void {
    $endpoints = SpText::endpoint('a', ", 'index' => 1") . SpText::endpoint('b', ", 'index' => 1");
    $parsed = (new SpRemote())->fromText(SpText::endpoints($endpoints), null);

    expect(array_map(static fn ($e): string => $e->pointer, $parsed->errors))
        ->toBe(['/AssertionConsumerService/1/index']);
});

it('rejects more than one default endpoint in a service', function (): void {
    $endpoints = SpText::endpoint('a', ", 'isDefault' => true") . SpText::endpoint('b', ", 'isDefault' => true");
    $parsed = (new SpRemote())->fromText(SpText::endpoints($endpoints), null);

    expect(array_map(static fn ($e): string => $e->pointer, $parsed->errors))
        ->toBe(['/AssertionConsumerService/1/isDefault']);
});

it('accepts the same index in two different services', function (): void {
    $text = SpText::endpoints(SpText::endpoint('a', ", 'index' => 1"), "'DiscoveryResponse' => [['Binding' => "
        . "'urn:oasis:names:tc:SAML:profiles:SSO:idp-discovery-protocol', "
        . "'Location' => 'https://a.example.org/d', 'index' => 1]],");

    expect((new SpRemote())->fromText($text, null)->errors)->toBe([]);
});

it('rejects a pasted certificate that cannot be parsed', function (string $pem): void {
    $keys = "'keys' => [['type' => 'X509Certificate', 'X509Certificate' => '$pem']],";
    $text = SpText::endpoints(SpText::endpoint('a'), $keys);
    $parsed = (new SpRemote())->fromText($text, null);

    expect(array_map(static fn ($e): string => $e->pointer, $parsed->errors))->toBe(['/certificates/0/pem'])
        ->and($parsed->errors[0]->line)->toBe(3);
})->with([
    'not base64' => ['***not base64***'],
    'base64 of nothing' => ['AAAA'],
]);

it('rejects a certificate field with two certificates', function (): void {
    $document = SpFixtures::document('minimal');
    $document['certificates'] = [['pem' => SpFixtures::pem() . SpFixtures::pem(), 'use' => 'both']];

    $parsed = (new SpRemote())->fromText((new SpRemote())->toText('x', $document), null);

    expect(array_map(static fn ($e): string => $e->pointer, $parsed->errors))->toBe(['/certificates/0/pem']);
});

it('rejects an extra option that has the form of a Secret reference', function (): void {
    $text = SpText::endpoints(SpText::endpoint('a'), "'a.b' => ['c' => '%secret(token)%'],");
    $parsed = (new SpRemote())->fromText($text, null);

    expect(array_map(static fn ($e): string => $e->pointer, $parsed->errors))->toBe(['/extra/a.b/c']);
});

it('rejects an extra option that the translator emits or core adds', function (string $key): void {
    $document = SpFixtures::document('minimal');
    $document['extra'] = [$key => 'x'];

    $errors = (new SpRemote())->check($document);

    expect(array_map(static fn ($e): string => $e->pointer, $errors))->toBe(['/extra/' . $key]);
})->with([
    'keys', 'certData', 'name', 'expire', 'entityid', 'metadata-set', 'metadata-index', 'privatekey', 'new_keys',
]);

it('reports the errors of the schema and of the rules together, each at its line', function (): void {
    $text = SpText::endpoints(
        SpText::endpoint('a', ", 'index' => 1") . SpText::endpoint('b', ", 'index' => 1"),
        "'hide.from.discovery' => 'yes',\n'consent' => ['x' => '%secret(a)%'],",
    );
    $parsed = (new SpRemote())->fromText($text, null);
    $byPointer = [];
    foreach ($parsed->errors as $error) {
        $byPointer[$error->pointer] = $error->line;
    }

    expect($byPointer)->toBe([
        '/hide.from.discovery' => 3,
        '/AssertionConsumerService/1/index' => 2,
        '/extra/consent/x' => 4,
    ]);
});

it('applies the rules of the entity ID', function (string $id, ?string $message): void {
    $errors = (new EntityIdRules())->check($id);

    expect($errors === [] ? null : $errors[0]->message)->toBe($message);
})->with([
    'empty' => ['', 'The entity ID is required.'],
    'a valid one' => ['https://sp.example.org', null],
    'not a URI' => ['my-sp', null],
    'the longest' => [str_repeat('a', 1024), null],
    'too long' => [str_repeat('a', 1025), 'The entity ID is at most 1024 bytes long.'],
    'too long in bytes' => [str_repeat('é', 513), 'The entity ID is at most 1024 bytes long.'],
]);
