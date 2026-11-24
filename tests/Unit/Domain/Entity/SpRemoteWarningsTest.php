<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemoteWarnings;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpWarnings;

it('has no warning for a sound entity', function (): void {
    expect(SpWarnings::labels(SpFixtures::document('minimal')))->toBe([])
        ->and(SpWarnings::labels(SpFixtures::document('endpoints')))->toBe([]);
});

it('warns of a certificate that has expired or expires within the configured days', function (): void {
    $document = SpFixtures::document('minimal');
    $document['certificates'] = [['pem' => SpFixtures::pem(), 'use' => 'both']];
    $before = static fn (string $modifier): string => (new DateTimeImmutable(SpWarnings::VALID_TO))
        ->modify($modifier)->format('c');

    expect(SpWarnings::labels($document, now: $before('-31 days')))->toBe([])
        ->and(SpWarnings::labels($document, now: $before('-29 days')))->toBe(['Certificate expiring'])
        ->and(SpWarnings::labels($document, now: $before('+1 day')))->toBe(['Certificate expired']);
});

it('warns of SHA-1 as the signature algorithm', function (): void {
    $document = SpFixtures::document('minimal');
    $document['signature.algorithm'] = 'http://www.w3.org/2000/09/xmldsig#rsa-sha1';

    expect(SpWarnings::labels($document))->toBe(['SHA-1']);
});

it('warns of signing or signature checking switched off, once', function (): void {
    $document = SpFixtures::document('minimal');
    $document['saml20.sign.response'] = false;
    $document['validate.logout'] = false;
    $document['sign.logout'] = true;

    expect(SpWarnings::labels($document))->toBe(['Signing off']);
});

it('warns of an http endpoint in any service', function (): void {
    $document = SpFixtures::document('minimal');
    $document['SingleLogoutService'] = [[
        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        'Location' => 'https://sp.example.org/slo',
        'ResponseLocation' => 'http://sp.example.org/slo',
    ]];

    expect(SpWarnings::labels($document))->toBe(['http endpoint']);
});

it('warns of an optional service with no usable endpoint, and not of one with a usable one', function (): void {
    $document = SpFixtures::document('minimal');
    $location = 'https://a.example.org';
    $unusable = ['Binding' => 'urn:oasis:names:tc:SAML:1.0:profiles:browser-post', 'Location' => $location];
    $usable = ['Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', 'Location' => $location];

    $document['SingleLogoutService'] = [$unusable];
    $none = SpWarnings::labels($document);
    $document['SingleLogoutService'] = [$unusable, $usable];

    expect($none)->toBe(['Unusable endpoints'])
        ->and(SpWarnings::labels($document))->toBe([]);
});

it('warns of an entity ID that is not an absolute URI', function (string $id, array $expected): void {
    expect(SpWarnings::labels(SpFixtures::document('minimal'), $id))->toBe($expected);
})->with([
    'a plain name' => ['my-sp', ['Entity ID not a URI']],
    'a URN' => ['urn:example:sp', []],
    'an https URL' => ['https://sp.example.org/metadata', []],
]);

it('warns of the use of extra', function (): void {
    $document = SpFixtures::document('minimal');
    $document['extra'] = ['consent.disable' => true];

    expect(SpWarnings::labels($document))->toBe(['Uses extra']);
});

it('gives each warning a message that says what is wrong', function (): void {
    $document = SpFixtures::document('minimal');
    $document['extra'] = ['consent.disable' => true];

    $warnings = (new SpRemoteWarnings(30))->of('my-sp', $document, new DateTimeImmutable('2026-11-24'));

    expect(array_map(static fn ($w): string => $w->message, $warnings))
        ->toBe(['The entity ID is not an absolute URI.', 'The entity uses extra, options the Console does not check.']);
});
