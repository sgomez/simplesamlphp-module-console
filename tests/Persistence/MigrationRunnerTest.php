<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Infrastructure\Persistence\MigrationRunner;
use SimpleSAML\Module\console\Tests\Support\Db;
use SimpleSAML\Module\console\Tests\Support\Engines;
use SimpleSAML\Module\console\Tests\Support\Helpers;

it('applies the nine migrations on a fresh database and leaves one migrate row', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);

    $report = (new MigrationRunner($pdo, $settings->prefix))->run('alice');

    $audit = $pdo->query(
        'SELECT identity, action, object_type, document, schema_version FROM ' . $settings->table('audit'),
    );
    $pointer = $pdo->query(
        'SELECT current_number, last_number FROM ' . $settings->table('pointer') . ' WHERE id = 1',
    );

    expect($report->outcome)->toBe(MigrationOutcome::Applied)
        ->and($report->applied)->toBe(range(1, 9))
        ->and(Db::applied($pdo, $settings->table('schema_version')))->toBe(range(1, 9))
        ->and($audit === false ? null : $audit->fetchAll())->toBe([[
            'identity' => 'alice',
            'action' => 'migrate',
            'object_type' => null,
            'document' => null,
            'schema_version' => 9,
        ]])
        ->and($pointer === false ? null : $pointer->fetchAll())
            ->toBe([['current_number' => null, 'last_number' => 0]])
        ->and(Helpers::inspect($settings))->toBe(DatabaseState::Ready);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('creates every table of section 4.4 with its columns', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);
    (new MigrationRunner($pdo, $settings->prefix))->run('alice');

    $columns = [
        'entity' => 'entity_set, entity_id, enabled, document, version, external_fingerprint, created_at, updated_at',
        'authsource' => 'id, type, enabled, document, version, created_at, updated_at',
        'snapshot' => 'number, format_version, checksum, document, comment, created_at, created_by',
        'node' => 'identifier, served_number, checked_at, has_problems',
        'audit' => 'id, at, identity, action, object_type, entity_set, entity_id, authsource_id, document, '
            . 'snapshot_from, snapshot_to, comment, schema_version',
    ];
    foreach ($columns as $table => $list) {
        $pdo->query('SELECT ' . $list . ' FROM ' . $settings->table($table) . ' WHERE 1 = 0');
    }

    expect(array_keys($columns))->toHaveCount(5);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('does nothing on a database that is already up to date', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);
    $runner = new MigrationRunner($pdo, $settings->prefix);
    $runner->run('alice');

    $report = $runner->run('bob');

    expect($report->outcome)->toBe(MigrationOutcome::Applied)
        ->and($report->applied)->toBe([])
        ->and(Db::count($pdo, $settings->table('audit')))->toBe(1);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
