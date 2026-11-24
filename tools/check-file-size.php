<?php

declare(strict_types=1);

const LIMIT = 5000;

$root = dirname(__DIR__);
$failures = [];

foreach (['src', 'tests'] as $dir) {
    $files = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/' . $dir, FilesystemIterator::SKIP_DOTS));
    foreach ($files as $file) {
        if (!$file instanceof SplFileInfo || $file->getExtension() !== 'php') {
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
