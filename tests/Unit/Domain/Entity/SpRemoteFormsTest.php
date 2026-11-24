<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\CertificateFiles;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('accepts every form core accepts and returns the single form of the document', function (): void {
    $parsed = SpText::parse("'name' => 'A name', 'scope' => 'example.org', 'description' => ['es' => 'Hola'],\n"
        . "'contacts' => [['contactType' => 'technical', 'emailAddress' => 'a@example.org', "
        . "'telephoneNumber' => '1']],\n"
        . "'EntityAttributes' => ['n' => 'v'], 'RegistrationInfo' => ['authority' => 'a', 'instant' => 1795515300],\n"
        . "'SingleLogoutService' => [['Location' => 'https://a.example.org/slo']], 'UIInfo' => ['DisplayName' => []],");
    $document = (array) $parsed->document;

    expect($parsed->errors)->toBe([])
        ->and($document['name'])->toBe(['en' => 'A name'])
        ->and($document['scope'])->toBe(['example.org'])
        ->and($document['contacts'][0]['emailAddress'])->toBe(['a@example.org'])
        ->and($document['contacts'][0]['telephoneNumber'])->toBe(['1'])
        ->and($document['EntityAttributes'])->toBe([['name' => 'n', 'values' => ['v']]])
        ->and($document['RegistrationInfo']['instant'])->toBe('2026-11-24T10:15:00Z')
        ->and($document['SingleLogoutService'][0]['Binding'])
        ->toBe('urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect')
        ->and($document)->not->toHaveKey('UIInfo');
});

it('treats an empty list or map as unset', function (): void {
    $parsed = SpText::parse("'name' => [], 'contacts' => [], 'scope' => [], 'extra-thing' => [],");

    expect(array_keys((array) $parsed->document))->toBe(['AssertionConsumerService']);
});

it('reads a certData and rewrites it as PEM with lines of 64 characters', function (): void {
    $parsed = SpText::parse("'certData' => '" . SpFixtures::body() . "',");
    $pem = $parsed->document['certificates'][0]['pem'] ?? '';

    expect($parsed->errors)->toBe([])
        ->and($parsed->document['certificates'][0]['use'] ?? null)->toBe('both')
        ->and($pem)->toBe(SpFixtures::pem());
});

it('reads keys by the use they declare and rejects the ones it cannot read', function (): void {
    $body = SpFixtures::body();
    $parsed = SpText::parse("'keys' => [['type' => 'X509Certificate', 'X509Certificate' => '$body', "
        . "'encryption' => false],"
        . " ['type' => 'X509Certificate', 'X509Certificate' => '$body', 'signing' => false],"
        . " ['type' => 'SSH', 'X509Certificate' => '$body'],"
        . " ['type' => 'X509Certificate', 'X509Certificate' => '$body', 'signing' => false, 'encryption' => false]],");
    $uses = array_map(static fn ($c): string => $c['use'], $parsed->document['certificates'] ?? []);

    expect($uses)->toBe(['signing', 'encryption'])
        ->and(SpText::pointers($parsed))->toContain('/keys/2')
        ->and(SpText::pointers($parsed))->toContain('/keys/3');
});

it('reads a certificate file through the node and stores it pasted', function (): void {
    $files = new class implements CertificateFiles {
        public function read(string $location): ?string
        {
            return $location === 'sp.crt' ? SpFixtures::pem() : null;
        }
    };

    $found = SpText::parse("'certificate' => 'sp.crt',", null, $files);
    $missing = SpText::parse("'certificate' => 'pdo://x',", null, $files);

    expect($found->errors)->toBe([])
        ->and($found->document['certificates'][0]['pem'] ?? null)->toBe(SpFixtures::pem())
        ->and(SpText::pointers($missing))->toBe(['/certificate']);
});

it('ignores certData when keys is present, as core does, and says so', function (): void {
    $body = SpFixtures::body();
    $parsed = SpText::parse(
        "'keys' => [['type' => 'X509Certificate', 'X509Certificate' => '$body']], 'certData' => '$body',",
    );

    expect($parsed->document['certificates'] ?? [])->toHaveCount(1)
        ->and($parsed->notices[0]->message)->toContain('certData');
});
