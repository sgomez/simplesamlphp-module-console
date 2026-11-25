<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ValidationParity;

it('keeps the opis results the front end compares its validators with up to date', function (): void {
    $committed = (string) @file_get_contents(dirname(__DIR__, 2) . '/' . ValidationParity::FILE);

    expect($committed)->toBe(ValidationParity::json(), 'Run composer parity and commit ' . ValidationParity::FILE);
});

it('holds every valid and invalid fixture of every set that has fixtures', function (): void {
    $fixtures = array_map(
        static fn (array $case): string => $case['set'] . ':' . $case['fixture'],
        ValidationParity::cases(),
    );

    expect($fixtures)->toContain('saml20-sp-remote:valid/minimal')
        ->and($fixtures)->toContain('saml20-sp-remote:invalid/a binding that is not a URI')
        ->and($fixtures)->toHaveCount(4 + 32);
});
