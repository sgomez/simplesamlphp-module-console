<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\EntityConflict;
use SimpleSAML\Module\console\Tests\Support\Engines;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

it('updates an entity with the version it was loaded with, and records an edit', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $repository->create(EntityDb::SET, 'https://sp.example.org', ['a' => 1], 'alice');

    $version = $repository->update(EntityDb::SET, 'https://sp.example.org', 1, ['a' => 2], 'bob');

    expect($version)->toBe(2)
        ->and($repository->find(EntityDb::SET, 'https://sp.example.org')?->document)->toBe(['a' => 2])
        ->and($repository->find(EntityDb::SET, 'https://sp.example.org')?->version)->toBe(2)
        ->and(array_column(EntityDb::audit($pdo, $settings->table('audit')), 'action'))->toBe(['create', 'edit'])
        ->and(array_column(EntityDb::audit($pdo, $settings->table('audit')), 'identity'))->toBe(['alice', 'bob']);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('rejects an update with a stale version or of a missing entity, writing nothing', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $repository->create(EntityDb::SET, 'https://sp.example.org', ['a' => 1], 'alice');
    $repository->update(EntityDb::SET, 'https://sp.example.org', 1, ['a' => 2], 'alice');

    $stale = fn () => $repository->update(EntityDb::SET, 'https://sp.example.org', 1, ['a' => 3], 'bob');
    $gone = fn () => $repository->update(EntityDb::SET, 'https://gone.example.org', 1, ['a' => 3], 'bob');

    expect($stale)->toThrow(EntityConflict::class)
        ->and($gone)->toThrow(EntityConflict::class)
        ->and($repository->find(EntityDb::SET, 'https://sp.example.org')?->document)->toBe(['a' => 2])
        ->and(EntityDb::audit($pdo, $settings->table('audit')))->toHaveCount(2);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('writes the entity and its Audit trail row in one transaction', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $pdo->exec('DROP TABLE ' . $settings->table('audit'));

    $create = fn () => $repository->create(EntityDb::SET, 'https://sp.example.org', ['a' => 1], 'alice');

    expect($create)->toThrow(PDOException::class)
        ->and($repository->find(EntityDb::SET, 'https://sp.example.org'))->toBeNull()
        ->and($pdo->inTransaction())->toBeFalse();
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('reports a row whose document is not valid JSON as unreadable', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $pdo->exec(
        'INSERT INTO ' . $settings->table('entity')
        . " VALUES ('" . EntityDb::SET . "', 'https://bad.example.org', 1, '{oops', 3, NULL, 'x', 'x')",
    );

    $found = $repository->find(EntityDb::SET, 'https://bad.example.org');

    expect($found?->document)->toBeNull()
        ->and($found?->loadError)->not->toBeNull()
        ->and($found?->version)->toBe(3);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
