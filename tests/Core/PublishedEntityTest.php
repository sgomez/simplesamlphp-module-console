<?php

declare(strict_types=1);

use SimpleSAML\Error\MetadataNotFound;
use SimpleSAML\Module\console\Tests\Support\CoreSources as Core;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

afterEach(function (): void {
    Core::reads([['type' => 'flatfile']]);
});

it('gives core the same array as the flat file, for every valid fixture', function (string $name): void {
    [$entityId, $flat] = SpFixtures::flatFile($name);
    $client = Core::published($name);

    $built = Core::snapshot($client->snapshotDir())->getMetaData($entityId, Core::SET);

    expect($built)->toBe(Core::flatFile($name)->getMetaData($entityId, Core::SET))
        ->and($built)->toBe($flat + ['entityid' => $entityId]);
})->with(SpFixtures::valid());

it('has core return the published entity with no access to the database', function (): void {
    [$entityId, $flat] = SpFixtures::flatFile('minimal');
    $client = Core::published('minimal');
    $client->withUnreachableDatabase();
    $handler = Core::reads([['type' => 'console:Snapshot']]);

    $metadata = $handler->getMetaData($entityId, Core::SET);

    expect($metadata['entityid'])->toBe($entityId)
        ->and($metadata['AssertionConsumerService'])->toBe($flat['AssertionConsumerService'])
        ->and(array_keys($handler->getList(Core::SET)))->toBe([$entityId]);
});

it('keeps answering from the other sources when the build is corrupt', function (): void {
    [$entityId] = SpFixtures::flatFile('minimal');
    $client = Core::published('minimal');
    file_put_contents($client->snapshotDir() . '/1-1/' . Core::SET . '.php', '<?php return [;');

    $handler = Core::reads([
        ['type' => 'console:Snapshot'],
        ['type' => 'flatfile', 'file' => Core::flatPath('minimal')],
    ]);

    expect($handler->getMetaData($entityId, Core::SET)['entityid'])->toBe($entityId);
});

it('causes no fatal error when the current file is missing', function (): void {
    [$entityId] = SpFixtures::flatFile('minimal');
    $client = Core::published('minimal');
    unlink($client->snapshotDir() . '/current');

    $handler = Core::reads([['type' => 'console:Snapshot']]);

    expect($handler->getList(Core::SET))->toBe([])
        ->and(fn () => $handler->getMetaData($entityId, Core::SET))->toThrow(MetadataNotFound::class);
});
