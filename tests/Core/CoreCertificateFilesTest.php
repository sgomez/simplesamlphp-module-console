<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

it('reads a certificate file as core reads it', function (): void {
    $file = (string) getenv('CONSOLE_TEST_DIR') . '/sp.crt';
    file_put_contents($file, SpFixtures::pem());

    expect((new CoreCertificateFiles())->read($file))->toContain('-----BEGIN CERTIFICATE-----');
});

it('answers null for a location core cannot read', function (string $location): void {
    expect((new CoreCertificateFiles())->read($location))->toBeNull();
})->with(['a missing file' => ['/nonexistent/sp.crt'], 'a location of no kind' => ['pdo://missing-table/x']]);
