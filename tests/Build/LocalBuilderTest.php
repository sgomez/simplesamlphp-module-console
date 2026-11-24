<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Publication\StoredSnapshot;
use SimpleSAML\Module\console\Infrastructure\Build\BuildFailed;
use SimpleSAML\Module\console\Infrastructure\Build\LocalBuilder;
use SimpleSAML\Module\console\Tests\Support\BuildFixtures as B;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures;

it('writes the build, its manifest and the current file, all readable by the owner only', function (): void {
    $dir = B::dir();

    $name = (new LocalBuilder($dir, '1.2.3'))->build(B::snapshot(1));

    $manifest = json_decode((string) file_get_contents($dir . '/1-1/manifest.json'), true);
    $files = glob($dir . '/1-1/*') ?: [];
    expect($files)->toHaveCount(5)
        ->and($name)->toBe('1-1')
        ->and(file_get_contents($dir . '/current'))->toBe('1-1')
        ->and($manifest['snapshot'])->toBe(1)
        ->and($manifest['format_version'])->toBe(1)
        ->and($manifest['checksum'])->toBe(B::snapshot(1)->checksum)
        ->and($manifest['module_version'])->toBe('1.2.3')
        ->and($manifest['left_out'])->toBe([])
        ->and(array_map(static fn (string $f): string => decoct(fileperms($f) & 0777), $files))
        ->each->toBe('600')
        ->and(decoct(fileperms($dir . '/current') & 0777))->toBe('600');
});

it('writes the set file as a return of an array keyed by entity ID', function (): void {
    $dir = B::dir();
    (new LocalBuilder($dir, ''))->build(B::snapshot(1));

    $served = require $dir . '/1-1/saml20-sp-remote.php';

    expect(array_keys($served))->toBe(['https://a.example.org'])
        ->and($served['https://a.example.org']['AssertionConsumerService'][0]['Location'])
        ->toBe('https://a.example.org/acs')
        ->and(require $dir . '/1-1/authsources.php')->toBe([]);
});

it('gives a rebuild of the same number the next build and never rewrites a file', function (): void {
    $dir = B::dir();
    $builder = new LocalBuilder($dir, '');
    $builder->build(B::snapshot(1));
    $before = file_get_contents($dir . '/1-1/saml20-sp-remote.php');

    $name = $builder->build(B::snapshot(1));

    expect($name)->toBe('1-2')
        ->and(file_get_contents($dir . '/current'))->toBe('1-2')
        ->and(file_get_contents($dir . '/1-1/saml20-sp-remote.php'))->toBe($before);
});

it('keeps the current and the previous build and removes the older ones', function (): void {
    $dir = B::dir();
    $builder = new LocalBuilder($dir, '');
    foreach ([1, 2, 3] as $number) {
        $builder->build(B::snapshot($number));
    }

    expect(B::builds($dir))->toBe(['2-1', '3-1'])
        ->and(file_get_contents($dir . '/current'))->toBe('3-1');
});

it('refuses a checksum that does not match, keeping the build being served', function (): void {
    $dir = B::dir();
    $builder = new LocalBuilder($dir, '');
    $builder->build(B::snapshot(1));
    $bad = new StoredSnapshot(2, 1, str_repeat('0', 64), B::snapshot(2)->document);

    expect(fn () => $builder->build($bad))->toThrow(BuildFailed::class, 'checksum')
        ->and(file_get_contents($dir . '/current'))->toBe('1-1')
        ->and(B::builds($dir))->toBe(['1-1']);
});

it('refuses a format version newer than the code knows', function (): void {
    $dir = B::dir();
    $good = B::snapshot(1);
    $newer = new StoredSnapshot(1, 2, $good->checksum, $good->document);

    expect(fn () => (new LocalBuilder($dir, ''))->build($newer))
        ->toThrow(BuildFailed::class, 'format version')
        ->and(file_exists($dir . '/current'))->toBeFalse();
});

it('keeps serving its build when writing the new one fails', function (): void {
    $dir = B::dir();
    $builder = new LocalBuilder($dir, '');
    $builder->build(B::snapshot(1));
    chmod($dir, 0500);

    try {
        expect(fn () => $builder->build(B::snapshot(2)))->toThrow(BuildFailed::class);
    } finally {
        chmod($dir, 0700);
    }

    expect(file_get_contents($dir . '/current'))->toBe('1-1')
        ->and(B::builds($dir))->toBe(['1-1'])
        ->and(glob($dir . '/.building-*'))->toBe([]);
})->skip(function_exists('posix_geteuid') && posix_geteuid() === 0, 'root ignores directory permissions');

it('leaves an entity the code cannot translate out of the build and says why', function (): void {
    $dir = B::dir();
    $snapshot = B::snapshot(1, [
        'https://a.example.org' => PublishFixtures::VALID,
        'https://broken.example.org' => ['AssertionConsumerService' => 'not a list'],
    ]);

    (new LocalBuilder($dir, ''))->build($snapshot);

    $manifest = json_decode((string) file_get_contents($dir . '/1-1/manifest.json'), true);
    expect(array_keys(require $dir . '/1-1/saml20-sp-remote.php'))->toBe(['https://a.example.org'])
        ->and($manifest['left_out'])->toHaveCount(1)
        ->and($manifest['left_out'][0]['entityid'])->toBe('https://broken.example.org')
        ->and($manifest['left_out'][0]['set'])->toBe('saml20-sp-remote')
        ->and($manifest['left_out'][0]['reason'])->not->toBe('');
});
