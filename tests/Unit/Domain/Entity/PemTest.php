<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\Pem;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

it('rewrites a certificate as PEM with lines of 64 characters, from its body or its armour', function (): void {
    $body = SpFixtures::body();
    $spaced = "  -----BEGIN CERTIFICATE-----\r\n" . chunk_split($body, 40, "\r\n") . "-----END CERTIFICATE-----  \n";

    expect(Pem::normalise($body))->toBe(SpFixtures::pem())
        ->and(Pem::normalise($spaced))->toBe(SpFixtures::pem())
        ->and(Pem::normalise(SpFixtures::pem()))->toBe(SpFixtures::pem());

    $lines = explode("\n", trim(SpFixtures::pem()));
    array_shift($lines);
    array_pop($lines);

    expect(max(array_map('strlen', $lines)))->toBe(64);
});

it('refuses what is not exactly one certificate', function (string $text): void {
    expect(Pem::normalise($text))->toBeNull();
})->with([
    'nothing' => [''],
    'text' => ['hello world'],
    'base64 of no certificate' => ['AAAA'],
    'two certificates' => [SpFixtures::pem() . SpFixtures::pem()],
    'a certificate and a key' => [SpFixtures::pem() . "-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n"],
    'a trailing character' => [SpFixtures::body() . '!'],
]);

it('takes the first certificate of a file, as core does', function (): void {
    $other = "-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----\n";

    expect(Pem::first("junk\n" . SpFixtures::pem() . $other))->toBe(SpFixtures::pem())
        ->and(Pem::first('no certificate'))->toBeNull()
        ->and(Pem::body(SpFixtures::pem()))->toBe(SpFixtures::body());
});
