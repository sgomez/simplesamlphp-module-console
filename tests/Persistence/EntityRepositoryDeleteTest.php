<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\Engines;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

it('deletes an entity, even an unreadable one, and audits it', function (string $engine): void {
    [$pdo, $repository, $settings] = EntityDb::repository($engine);
    $repository->create(EntityDb::SET, 'https://sp.example.org', ['a' => 1], 'alice');
    $pdo->exec(
        'INSERT INTO ' . $settings->table('entity')
        . " VALUES ('" . EntityDb::SET . "', 'https://bad.example.org', 1, '{oops', 3, NULL, 'x', 'x')",
    );

    $repository->delete(EntityDb::SET, 'https://sp.example.org', 'bob');
    $repository->delete(EntityDb::SET, 'https://bad.example.org', 'bob');
    $repository->delete(EntityDb::SET, 'https://gone.example.org', 'bob');
    $audit = EntityDb::audit($pdo, $settings->table('audit'));

    expect($repository->all(EntityDb::SET))->toBe([])
        ->and(array_column($audit, 'action'))->toBe(['create', 'delete', 'delete'])
        ->and(array_column($audit, 'document'))->toBe([json_encode(['a' => 1]), null, null])
        ->and(array_column($audit, 'entity_id'))->toBe([
            'https://sp.example.org',
            'https://sp.example.org',
            'https://bad.example.org',
        ]);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
