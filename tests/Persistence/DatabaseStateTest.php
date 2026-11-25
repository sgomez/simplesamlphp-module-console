<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;
use SimpleSAML\Module\console\Infrastructure\Persistence\ConnectionFactory;
use SimpleSAML\Module\console\Infrastructure\Persistence\StateInspector;
use SimpleSAML\Module\console\Tests\Support\Helpers;

it('opens PDO with exceptions, never persistent, and SQLite foreign keys on', function (): void {
    $file = Helpers::sqliteFile();
    $pdo = (new ConnectionFactory())->open(new DatabaseSettings('sqlite:' . $file));

    expect($pdo->getAttribute(PDO::ATTR_ERRMODE))->toBe(PDO::ERRMODE_EXCEPTION)
        ->and($pdo->query('PRAGMA foreign_keys')?->fetchColumn())->toBe(1)
        ->and(fn () => $pdo->query('SELECT * FROM nope'))->toThrow(PDOException::class);
    unlink($file);
});

it('asks MariaDB and MySQL for utf8mb4 and leaves other DSNs alone', function (): void {
    expect(ConnectionFactory::dsn('mysql:host=db;dbname=c'))->toBe('mysql:host=db;dbname=c;charset=utf8mb4')
        ->and(ConnectionFactory::dsn('mysql:host=db;dbname=c;charset=utf8mb4'))
            ->toBe('mysql:host=db;dbname=c;charset=utf8mb4')
        ->and(ConnectionFactory::dsn('pgsql:host=db;dbname=c'))->toBe('pgsql:host=db;dbname=c')
        ->and(ConnectionFactory::dsn('sqlite::memory:'))->toBe('sqlite::memory:');
});

it('rejects a table prefix that is not an identifier', function (): void {
    expect(fn () => new DatabaseSettings('sqlite::memory:', prefix: 'a; DROP'))
        ->toThrow(InvalidArgumentException::class);
});

it('reports an unreachable database', function (): void {
    expect(Helpers::inspect(new DatabaseSettings('sqlite:/nonexistent-dir/console.sqlite')))
        ->toBe(DatabaseState::Unreachable);
});

it('reports pending migrations when the versions table is missing', function (): void {
    $file = Helpers::sqliteFile();

    expect(Helpers::inspect(new DatabaseSettings('sqlite:' . $file)))->toBe(DatabaseState::MigrationsPending);
    unlink($file);
});

it('reads the applied numbers from the prefixed versions table', function (array $rows, DatabaseState $state): void {
    $file = Helpers::sqliteFile();
    $pdo = new PDO('sqlite:' . $file);
    $pdo->exec('CREATE TABLE app_console_schema_version (version INTEGER NOT NULL PRIMARY KEY, applied_at CHAR(20))');
    foreach ($rows as $number) {
        $pdo->exec("INSERT INTO app_console_schema_version VALUES ($number, '2026-11-24T10:15:00Z')");
    }

    expect(Helpers::inspect(new DatabaseSettings('sqlite:' . $file, prefix: 'app_'), 3))->toBe($state);
    unlink($file);
})->with([
    'complete' => [[1, 2, 3], DatabaseState::Ready],
    'empty' => [[], DatabaseState::MigrationsPending],
    'gap' => [[1, 3], DatabaseState::MigrationsPending],
    'newer database' => [[1, 2, 3, 4], DatabaseState::ConsoleOlder],
    'newer with a gap' => [[1, 4], DatabaseState::ConsoleOlder],
]);

it('reports SQLite below 3.24.0 before reading the schema', function (): void {
    $file = Helpers::sqliteFile();
    $inspector = new StateInspector(
        new ConnectionFactory(),
        new DatabaseSettings('sqlite:' . $file),
        9,
        static fn (): string => '3.22.0',
    );
    $status = $inspector->read()->status;

    expect($status->state)->toBe(DatabaseState::SqliteTooOld)
        ->and($status->sqliteVersion)->toBe('3.22.0');
    unlink($file);
});

it('does not apply the SQLite check to other engines', function (): void {
    $settings = new DatabaseSettings('sqlite:' . Helpers::sqliteFile());

    expect(Helpers::inspect($settings))->not->toBe(DatabaseState::SqliteTooOld);
});
