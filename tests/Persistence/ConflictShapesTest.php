<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Persistence\ConflictShapes;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('recognises every shape a lost race takes', function (PDOException $error): void {
    expect(ConflictShapes::isConflict($error))->toBeTrue();
})->with([
    'serialization failure or deadlock' => [SpText::pdoError('40001', 1213)],
    'PostgreSQL deadlock' => [SpText::pdoError('40P01', 7)],
    'MariaDB 11.6.2 and later' => [SpText::pdoError('HY000', 1020)],
    'SQLite busy' => [SpText::pdoError('HY000', 5, 'database is locked')],
]);

it('does not take any other error for a lost race', function (PDOException $error): void {
    expect(ConflictShapes::isConflict($error))->toBeFalse();
})->with([
    'syntax error' => [SpText::pdoError('42000', 1064)],
    'a general error' => [SpText::pdoError('HY000', 1)],
    'no error info' => [new PDOException('x')],
]);

it('recognises a primary-key clash and nothing else of the integrity errors', function (): void {
    expect(ConflictShapes::isDuplicateKey(SpText::pdoError('23505', 7)))->toBeTrue()
        ->and(ConflictShapes::isDuplicateKey(SpText::pdoError('23000', 1062)))->toBeTrue()
        ->and(ConflictShapes::isDuplicateKey(SpText::pdoError('23000', 19, 'UNIQUE constraint failed')))->toBeTrue()
        ->and(ConflictShapes::isDuplicateKey(SpText::pdoError('23000', 19, 'NOT NULL constraint failed')))->toBeFalse()
        ->and(ConflictShapes::isDuplicateKey(SpText::pdoError('23502', 7)))->toBeFalse()
        ->and(ConflictShapes::isDuplicateKey(SpText::pdoError('42000', 1064)))->toBeFalse();
});
