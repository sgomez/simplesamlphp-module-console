<?php

declare(strict_types=1);

it('ships no script that compiles code at runtime, which core\'s CSP forbids', function (string $file): void {
    expect(preg_match('/\bnew\s+Function\b|(?<![.\w$])Function\s*\(|\beval\s*\(/', (string) file_get_contents($file)))
        ->toBe(0, $file);
})->with(static fn (): array => [
    ...glob(dirname(__DIR__, 2) . '/public/assets/app/assets/*.js') ?: [],
    dirname(__DIR__, 2) . '/frontend/src/domain/documents/generated/validators.js',
]);
