<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ValidationParity;

it('keeps the opis results the front end compares its validators with up to date', function (): void {
    $committed = (string) @file_get_contents(dirname(__DIR__, 2) . '/' . ValidationParity::FILE);

    expect($committed)->toBe(ValidationParity::json(), 'Run composer parity and commit ' . ValidationParity::FILE);
});

it('holds every valid and invalid fixture of every set that has fixtures', function (): void {
    $fixtures = dirname(__DIR__) . '/Fixtures';
    $expected = [];
    foreach (['saml20-sp-remote', 'saml20-idp-remote', 'saml20-idp-hosted'] as $set) {
        foreach (glob($fixtures . '/' . $set . '/valid/*.json') ?: [] as $file) {
            $expected[] = $set . ':valid/' . basename($file, '.json');
        }
        $invalid = json_decode((string) file_get_contents($fixtures . '/' . $set . '/invalid.json'), true);
        foreach ($invalid as $case) {
            $expected[] = $set . ':invalid/' . $case['name'];
        }
    }

    $cases = array_map(
        static fn (array $case): string => $case['set'] . ':' . $case['fixture'],
        ValidationParity::cases(),
    );

    expect($cases)->toEqualCanonicalizing($expected);
});
