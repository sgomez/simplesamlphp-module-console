<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Domain\DatabaseStatus;
use SimpleSAML\Module\console\Domain\SqliteVersion;

it('is ready when the applied numbers are exactly 1 to N', function (): void {
    expect(DatabaseStatus::ofSchema([3, 1, 2], 3)->state)->toBe(DatabaseState::Ready);
});

it('asks for migrations when the versions table is missing', function (): void {
    $status = DatabaseStatus::ofSchema(null, 9);

    expect($status->state)->toBe(DatabaseState::MigrationsPending)
        ->and($status->missing)->toBe([1, 2, 3, 4, 5, 6, 7, 8, 9]);
});

it('asks for migrations when the table is empty or has gaps', function (array $applied, array $missing): void {
    $status = DatabaseStatus::ofSchema($applied, 5);

    expect($status->state)->toBe(DatabaseState::MigrationsPending)
        ->and($status->missing)->toBe($missing);
})->with([
    'empty' => [[], [1, 2, 3, 4, 5]],
    'prefix' => [[1, 2], [3, 4, 5]],
    'gap' => [[1, 2, 4, 5], [3]],
]);

it('is older than the database when any applied number is above N, even with gaps', function (): void {
    $status = DatabaseStatus::ofSchema([1, 3, 6], 5);

    expect($status->state)->toBe(DatabaseState::ConsoleOlder)
        ->and($status->known)->toBe(5)
        ->and($status->highest)->toBe(6);
});

it('keeps the SQLite version on its page state', function (): void {
    $status = DatabaseStatus::sqliteTooOld('3.22.0');

    expect($status->state)->toBe(DatabaseState::SqliteTooOld)
        ->and($status->sqliteVersion)->toBe('3.22.0')
        ->and(DatabaseStatus::unreachable()->state)->toBe(DatabaseState::Unreachable);
});

it('supports SQLite from 3.24.0', function (string $version, bool $supported): void {
    expect(SqliteVersion::isSupported($version))->toBe($supported);
})->with([
    ['3.23.1', false],
    ['3.24.0', true],
    ['3.45.1', true],
    ['3.9.2', false],
    ['4.0.0', true],
]);
