<?php

declare(strict_types=1);

it('keeps the page shell as the only template', function (): void {
    expect(scandir(dirname(__DIR__, 2) . '/templates'))->toBe(['.', '..', 'app.twig']);
});

it('serves only the built front end and the favicon from the assets', function (): void {
    $assets = dirname(__DIR__, 2) . '/public/assets';
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($assets, FilesystemIterator::SKIP_DOTS));
    $served = [];
    foreach ($files as $file) {
        $path = substr((string) $file, strlen($assets) + 1);
        if (!str_starts_with($path, 'app/')) {
            $served[] = $path;
        }
    }

    sort($served);

    expect($served)->toBe(['img/favicon.svg']);
});
