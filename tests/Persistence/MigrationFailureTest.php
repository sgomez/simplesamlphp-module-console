<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;
use SimpleSAML\Module\console\Infrastructure\Persistence\MigrationRunner;
use SimpleSAML\Module\console\Tests\Support\Db;
use SimpleSAML\Module\console\Tests\Support\Engines;

it('stops at the failing migration, says which and why, and keeps what was applied', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);
    $catalog = [
        Migration::uniform(1, 'CREATE TABLE console_first (id INTEGER NOT NULL PRIMARY KEY)'),
        Migration::uniform(2, 'CREATE TABLE console_second (id INTEGER NOT NULL PRIMARY KEY,, id2)'),
        Migration::uniform(3, 'CREATE TABLE console_third (id INTEGER NOT NULL PRIMARY KEY)'),
    ];

    $report = (new MigrationRunner($pdo, $settings->prefix, $catalog))->run('alice');

    expect($report->outcome)->toBe(MigrationOutcome::Failed)
        ->and($report->failedAt)->toBe(2)
        ->and($report->reason)->not->toBeEmpty()
        ->and($report->applied)->toBe([1])
        ->and(Db::applied($pdo, $settings->table('schema_version')))->toBe([1])
        ->and(Db::tableExists($pdo, $settings->prefix . 'console_first'))->toBeTrue()
        ->and(Db::tableExists($pdo, $settings->prefix . 'console_third'))->toBeFalse();
    $pdo->exec('DROP TABLE IF EXISTS ' . $settings->prefix . 'console_first');
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('does not touch the Audit trail when the run stopped before it existed', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);
    $catalog = [Migration::uniform(1, 'CREATE TABLE console_first (,)')];

    $report = (new MigrationRunner($pdo, $settings->prefix, $catalog))->run('alice');

    expect($report->outcome)->toBe(MigrationOutcome::Failed)
        ->and($report->applied)->toBe([])
        ->and(Db::tableExists($pdo, $settings->table('audit')))->toBeFalse();
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('tells the loser of two concurrent runs, and the winner leaves the only row', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);
    $winner = Engines::connect($settings);
    $raced = false;
    $race = function (int $number) use (&$raced, $winner, $settings): void {
        if (!$raced) {
            $raced = true;
            (new MigrationRunner($winner, $settings->prefix))->run('winner');
        }
    };

    $report = (new MigrationRunner($pdo, $settings->prefix, null, $race))->run('loser');
    $rows = $pdo->query('SELECT identity FROM ' . $settings->table('audit'));

    expect($report->outcome)->toBe(MigrationOutcome::Concurrent)
        ->and($report->applied)->toBe([])
        ->and($rows === false ? null : $rows->fetchAll(PDO::FETCH_COLUMN))->toBe(['winner'])
        ->and(Db::applied($pdo, $settings->table('schema_version')))->toBe(range(1, 9));
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('shares the transaction of migration and version row except on MariaDB and MySQL', function (string $engine): void {
    [$pdo, $settings] = Db::fresh($engine);
    $other = Engines::connect($settings);
    $catalog = [Migration::uniform(1, 'CREATE TABLE console_first (id INTEGER NOT NULL PRIMARY KEY)')];
    $race = static function (int $number) use ($other, $settings): void {
        $other->exec(
            'INSERT INTO ' . $settings->table('schema_version') . " VALUES (1, '2026-11-24T10:15:00Z')",
        );
    };

    $report = (new MigrationRunner($pdo, $settings->prefix, $catalog, $race))->run('loser');
    $statementFirst = str_starts_with($engine, 'maria') || $engine === 'mysql';

    expect($report->outcome)->toBe(MigrationOutcome::Concurrent)
        ->and(Db::tableExists($pdo, $settings->prefix . 'console_first'))->toBe($statementFirst);
    $pdo->exec('DROP TABLE IF EXISTS ' . $settings->prefix . 'console_first');
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
