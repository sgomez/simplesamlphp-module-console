<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('ties an error inside extra to the line of its option, whatever characters its name has', function (): void {
    $parsed = SpText::parse("'ok' => true,\n'a/b~c' => ['x' => '%secret(z)%'],");

    expect(SpText::pointers($parsed))->toBe(['/extra/a~1b~0c/x'])
        ->and($parsed->errors[0]->line)->toBe(4);
});

it('ties notices to the line of their option', function (): void {
    $body = SpFixtures::body();
    $parsed = SpText::parse(
        "'expire' => 1795515300,\n'keys' => [['type' => 'X509Certificate', 'X509Certificate' => '$body']],\n"
        . "'certData' => '$body',\n'consent.x' => 1,",
    );
    $lines = [];
    foreach ($parsed->notices as $notice) {
        $lines[(string) $notice->option] = $notice->line;
    }

    expect($lines)->toBe(['expire' => 3, 'certData' => 5, 'consent.x' => 6]);
});

it('suggests an option only within two edits of the name, whatever its case', function (): void {
    $suggestion = static fn (string $name): string => SpText::parse("'$name' => 1,")->notices[0]->message;

    expect($suggestion('SingleLogoutServic'))->toContain("Did you mean 'SingleLogoutService'")
        ->and($suggestion('singlelogoutservi'))->toContain("Did you mean 'SingleLogoutService'")
        ->and($suggestion('SingleLogoutServ'))->not->toContain('Did you mean')
        ->and($suggestion('SingleLogoutServ'))->toContain("'SingleLogoutServ' is not a cataloged option");
});

it('does not take the key options of a slot, which are not available yet', function (string $option): void {
    $parsed = SpText::parse("'$option' => 'x',");

    expect(SpText::pointers($parsed))->toBe(['/' . $option]);
})->with(['key_name', 'privatekey', 'privatekey_pass']);

it('reads the instant of a registration as the moment it is, whatever offset it is written with', function (): void {
    $document = SpFixtures::document('description');
    $document['RegistrationInfo']['instant'] = '2026-11-24T11:15:00+01:00';

    expect((new SpRemote())->toCore($document)['RegistrationInfo']['instant'])->toBe(1795515300);
});

it('keeps an unset option out of the text, and every set one in it', function (): void {
    $text = (new SpRemote())->toText('https://sp.example.org', SpFixtures::document('minimal'));

    expect($text)->toBe(<<<'PHP'
        $metadata['https://sp.example.org'] = [
            'AssertionConsumerService' => [
                [
                    'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                    'Location' => 'https://sp.example.org/acs',
                ],
            ],
        ];
        PHP);
});
