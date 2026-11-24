<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpWarnings;

it('names every signing option switched off, and none switched on', function (): void {
    $options = ['saml20.sign.response', 'saml20.sign.assertion', 'sign.authnrequest', 'sign.logout',
        'validate.authnrequest', 'validate.logout'];

    expect(SpWarnings::warningMessages(array_fill_keys($options, false)))->toBe([
        'Signing or signature checking is switched off: ' . implode(', ', $options) . '.',
    ])->and(SpWarnings::warningMessages(array_fill_keys($options, true)))->toBe([]);
});

it('warns of SHA-1 in either algorithm option, whatever its case', function (): void {
    $sha256 = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';

    expect(SpWarnings::warningMessages(['metadata.sign.algorithm' => 'http://www.w3.org/2000/09/xmldsig#RSA-SHA1']))
        ->toBe(["'metadata.sign.algorithm' uses SHA-1."])
        ->and(SpWarnings::warningMessages(['signature.algorithm' => $sha256]))->toBe([]);
});

it('names the service with an http endpoint, in each service and either location', function (string $service): void {
    $endpoint = ['Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', 'Location' => 'HTTP://a.example.org'];

    expect(SpWarnings::warningMessages([$service => [$endpoint]]))
        ->toBe(["An endpoint of $service uses http, not https."]);
})->with(['AssertionConsumerService', 'SingleLogoutService', 'DiscoveryResponse']);

it('takes each binding core uses for single logout as usable', function (string $binding): void {
    $endpoint = ['Binding' => $binding, 'Location' => 'https://a.example.org'];

    expect(SpWarnings::warningMessages(['SingleLogoutService' => [$endpoint]]))
        ->toBe([]);
})->with(['urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect', 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST']);

it('tolerates endpoints and services that are not arrays', function (): void {
    expect(SpWarnings::labels(['SingleLogoutService' => 'oops'] + SpFixtures::document('minimal')))
        ->toBe(['Unusable endpoints'])
        ->and(SpWarnings::labels(['SingleLogoutService' => ['oops']] + SpFixtures::document('minimal')))
        ->toBe(['Unusable endpoints']);
});
