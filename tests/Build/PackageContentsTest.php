<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\PackageContents;

it('ships every JSON Schema in the package', function (): void {
    $root = dirname(__DIR__, 2);
    $files = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root . '/docs/spec/schemas', FilesystemIterator::SKIP_DOTS),
    );
    $expected = [];
    foreach ($files as $file) {
        $expected[] = substr((string) $file, strlen($root) + 1);
    }

    expect($expected)->not->toBeEmpty()
        ->and(array_diff($expected, PackageContents::paths()))->toBe([]);
});

it('leaves the documentation out of the package', function (string $directory): void {
    $leaked = array_filter(
        PackageContents::paths(),
        static fn (string $path): bool => str_starts_with($path, $directory . '/'),
    );

    expect($leaked)->toBe([]);
})->with(['docs/adr', 'docs/agents', 'docs/spec/ddl', 'docs/spec/examples']);

it('ships the built front end with its manifest', function (): void {
    $built = array_filter(
        PackageContents::paths(),
        static fn (string $path): bool => str_starts_with($path, 'public/assets/app/assets/'),
    );

    expect(PackageContents::paths())->toContain('public/assets/app/.vite/manifest.json')
        ->and($built)->not->toBeEmpty();
});

it('leaves the front-end sources and the Node tooling out of the package', function (string $path): void {
    $leaked = array_filter(
        PackageContents::paths(),
        static fn (string $shipped): bool => $shipped === $path || str_starts_with($shipped, $path . '/'),
    );

    expect($leaked)->toBe([]);
})->with([
    'frontend',
    'package.json',
    'package-lock.json',
    'node_modules',
    'mise.toml',
    'vite.config.ts',
    'tsconfig.json',
    'eslint.config.js',
]);
