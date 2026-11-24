<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\EntityAlreadyExists;
use SimpleSAML\Module\console\Tests\Support\Engines;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

const SET = 'saml20-sp-remote';

it('creates an entity and finds it again, with its Audit trail row', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $document = ['AssertionConsumerService' => [['Binding' => 'urn:a:b', 'Location' => 'https://a.example.org/acs']]];

    $repository->create(SET, 'https://sp.example.org', $document, 'alice');
    $found = $repository->find(SET, 'https://sp.example.org');

    expect($found?->document)->toBe($document)
        ->and($found?->version)->toBe(1)
        ->and($found?->enabled)->toBeTrue()
        ->and($found?->entityId)->toBe('https://sp.example.org')
        ->and(EntityDb::audit($pdo, $settings->table('audit')))->toBe([[
            'identity' => 'alice',
            'action' => 'create',
            'object_type' => 'entity',
            'entity_set' => SET,
            'entity_id' => 'https://sp.example.org',
            'document' => json_encode($document, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]]);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('answers null for an entity that does not exist', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);

    expect($repository->find(SET, 'https://nope.example.org'))->toBeNull();
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('refuses to create an existing entity, a lost race included, and stores nothing', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $repository->create(SET, 'https://sp.example.org', ['a' => 1], 'alice');

    $second = fn () => $repository->create(SET, 'https://sp.example.org', ['a' => 2], 'bob');

    expect($second)->toThrow(EntityAlreadyExists::class)
        ->and($repository->find(SET, 'https://sp.example.org')?->document)->toBe(['a' => 1])
        ->and(EntityDb::audit($pdo, $settings->table('audit')))->toHaveCount(1);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('compares entity IDs byte for byte', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    foreach (['https://SP.example.org', 'https://sp.example.org', 'é', 'e'] as $id) {
        $repository->create(SET, $id, ['id' => $id], 'alice');
    }

    expect($repository->find(SET, 'https://SP.example.org')?->document)->toBe(['id' => 'https://SP.example.org'])
        ->and($repository->find(SET, 'é')?->document)->toBe(['id' => 'é'])
        ->and($repository->find(SET, 'E'))->toBeNull()
        ->and(array_map(static fn ($e): string => $e->entityId, $repository->all(SET)))
        ->toBe(['e', 'https://SP.example.org', 'https://sp.example.org', 'é']);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
