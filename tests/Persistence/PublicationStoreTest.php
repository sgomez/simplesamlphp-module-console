<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\Publication\PublicationInput;
use SimpleSAML\Module\console\Application\Publication\PublicationRefused;
use SimpleSAML\Module\console\Tests\Support\Engines;
use SimpleSAML\Module\console\Tests\Support\PublicationDb;

it('reads the entities and the pointer before the first Publication', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);

    $input = $store->read();

    expect($input->entities)->toHaveCount(1)
        ->and($input->currentNumber)->toBeNull()
        ->and($input->lastNumber)->toBe(0)
        ->and($input->currentDocument)->toBeNull();
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('stores the Snapshot, moves the pointer and records the publish row', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);

    $first = $store->publish(fn (PublicationInput $in): string => '{"n":1}', 'alice', 'first one');
    $second = $store->publish(fn (PublicationInput $in): string => '{"n":2}', 'bob', null);

    $rows = PublicationDb::snapshots($pdo, $settings);
    $pointer = $pdo->query('SELECT current_number, last_number FROM ' . $settings->table('pointer'))?->fetch();
    $audit = $pdo->query(
        'SELECT identity, object_type, document, snapshot_from, snapshot_to, comment FROM '
        . $settings->table('audit') . " WHERE action = 'publish' ORDER BY id",
    )?->fetchAll();

    expect([$first, $second])->toBe([1, 2])
        ->and($rows[0])->toMatchArray([
            'number' => 1,
            'format_version' => 1,
            'checksum' => hash('sha256', '{"n":1}'),
            'document' => '{"n":1}',
            'comment' => 'first one',
            'created_by' => 'alice',
        ])
        ->and($rows[1]['comment'])->toBeNull()
        ->and($pointer)->toMatchArray(['current_number' => 2, 'last_number' => 2])
        ->and($audit[0])->toMatchArray([
            'identity' => 'alice',
            'object_type' => null,
            'document' => null,
            'snapshot_from' => null,
            'snapshot_to' => 1,
            'comment' => 'first one',
        ])
        ->and($audit[1])->toMatchArray(['snapshot_from' => 1, 'snapshot_to' => 2]);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('shows the current Snapshot to the next read', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);
    $store->publish(fn (PublicationInput $in): string => '{"n":1}', 'alice', null);

    $input = $store->read();

    expect($input->currentNumber)->toBe(1)
        ->and($input->lastNumber)->toBe(1)
        ->and($input->currentDocument)->toBe('{"n":1}')
        ->and($input->currentCreatedAt)->not->toBeNull();
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('writes nothing when the decision refuses', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);
    $decide = function (PublicationInput $in): string {
        throw PublicationRefused::moved();
    };

    $refused = fn () => $store->publish($decide, 'alice', null);

    expect($refused)->toThrow(PublicationRefused::class)
        ->and(PublicationDb::snapshots($pdo, $settings))->toBe([])
        ->and($store->read()->lastNumber)->toBe(0);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('reports the limit of max_allowed_packet on MariaDB and MySQL only', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);
    $mysql = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'mysql';

    expect($store->documentLimit() !== null)->toBe($mysql);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
