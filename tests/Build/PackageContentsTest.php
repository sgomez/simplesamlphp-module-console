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
