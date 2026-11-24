<?php

declare(strict_types=1);

const LIMIT = 5000;

// Directory => extensions checked in it. Generated front-end files live under a `generated` directory and are exempt.
const CHECKED = [
    'src' => ['php'],
    'tests' => ['php'],
    'frontend/src' => ['ts', 'tsx'],
];

$root = dirname(__DIR__);
$failures = [];

foreach (CHECKED as $dir => $extensions) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $dir, FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if (
            !$file instanceof SplFileInfo
            || !in_array($file->getExtension(), $extensions, true)
            || str_contains($file->getPathname(), '/generated/')
        ) {
            continue;
        }
        $size = mb_strlen((string) file_get_contents($file->getPathname()));
        if ($size > LIMIT) {
            $failures[] = sprintf('%s: %d characters (limit %d)', substr($file->getPathname(), strlen($root) + 1), $size, LIMIT);
        }
    }
}

if ($failures !== []) {
    fwrite(STDERR, implode("\n", $failures) . "\n");
    exit(1);
}

echo "File sizes ok\n";
