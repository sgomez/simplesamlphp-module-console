<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Build\LocalBuilder;
use SimpleSAML\Module\console\MetadataStore\Snapshot;
use SimpleSAML\Module\console\Tests\Support\BuildFixtures as B;
use SimpleSAML\Module\console\Tests\Support\CoreSources as Core;
use SimpleSAML\Module\console\Tests\Support\PublishFixtures;

it('is the source core resolves from console:Snapshot', function (): void {
    expect(Core::snapshot(B::dir()))->toBeInstanceOf(Snapshot::class);
});

it('serves the entities of the current build, each with its entity ID as core adds it', function (): void {
    $dir = B::dir();
    (new LocalBuilder($dir, ''))->build(B::snapshot(1));
    $source = Core::snapshot($dir);

    $set = $source->getMetadataSet('saml20-sp-remote');

    expect(array_keys($set))->toBe(['https://a.example.org'])
        ->and($set['https://a.example.org']['entityid'])->toBe('https://a.example.org')
        ->and($source->getMetaData('https://a.example.org', 'saml20-sp-remote'))
        ->toBe($set['https://a.example.org'])
        ->and($source->getMetaData('https://other.example.org', 'saml20-sp-remote'))->toBeNull()
        ->and($source->getMetadataSet('saml20-idp-remote'))->toBe([])
        ->and($source->getMetadataSet('not-a-set'))->toBe([]);
});

it('reads the current file once per request', function (): void {
    $dir = B::dir();
    $builder = new LocalBuilder($dir, '');
    $builder->build(B::snapshot(1));
    $source = Core::snapshot($dir);
    $source->getMetadataSet('saml20-idp-remote');

    $builder->build(B::snapshot(2, ['https://b.example.org' => PublishFixtures::VALID]));

    expect(array_keys($source->getMetadataSet('saml20-sp-remote')))->toBe(['https://a.example.org'])
        ->and(array_keys(Core::snapshot($dir)->getMetadataSet('saml20-sp-remote')))->toBe(['https://b.example.org']);
});

it('returns no entities, without failing, when there is no current file', function (): void {
    expect(Core::snapshot(B::dir())->getMetadataSet('saml20-sp-remote'))->toBe([]);
});

it('returns no entities when the current file names a build that is not there or is not a build name', function (
    string $content,
): void {
    $dir = B::dir();
    mkdir($dir, 0700, true);
    file_put_contents($dir . '/current', $content);

    expect(Core::snapshot($dir)->getMetadataSet('saml20-sp-remote'))->toBe([]);
})->with(['missing build' => '7-1', 'traversal' => '../../etc', 'empty' => '']);

it('returns no entities for a set whose file is corrupt, and keeps answering the others', function (
    string $php,
): void {
    $dir = B::dir();
    (new LocalBuilder($dir, ''))->build(B::snapshot(1));
    file_put_contents($dir . '/1-1/saml20-sp-remote.php', $php);

    $source = Core::snapshot($dir);

    expect($source->getMetadataSet('saml20-sp-remote'))->toBe([])
        ->and($source->getMetadataSet('saml20-idp-remote'))->toBe([]);
})->with([
    'syntax error' => '<?php return [;',
    'not an array' => '<?php return 7;',
    'throws' => '<?php throw new Exception("x");',
]);

it('returns no entities when the set file is gone', function (): void {
    $dir = B::dir();
    (new LocalBuilder($dir, ''))->build(B::snapshot(1));
    unlink($dir . '/1-1/saml20-sp-remote.php');

    expect(Core::snapshot($dir)->getMetadataSet('saml20-sp-remote'))->toBe([]);
});
