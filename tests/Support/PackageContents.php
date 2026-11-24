<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

final class PackageContents
{
    /** @return list<string> paths the package archive ships */
    public static function paths(): array
    {
        $command = sprintf(
            'git -C %s archive --worktree-attributes HEAD | tar -t 2>&1',
            escapeshellarg(dirname(__DIR__, 2)),
        );
        exec($command, $paths, $status);
        expect($status)->toBe(0);

        return $paths;
    }
}
