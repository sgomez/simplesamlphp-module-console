<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\InverseRows;

it('turns the forms of the attribute policy into rows', function (): void {
    expect(InverseRows::attributes(['uid', 'mail' => ['a', 'b'], 'cn', 'sn' => 'x']))->toBe([
        ['name' => 'uid'],
        ['name' => 'mail', 'values' => ['a', 'b']],
        ['name' => 'cn'],
        ['name' => 'sn', 'values' => ['x']],
    ])->and(InverseRows::attributes([5 => 1]))->toBe([1])
        ->and(InverseRows::attributes('x'))->toBe('x');
});

it('turns the map of attribute encodings into rows', function (): void {
    expect(InverseRows::encodings(['a' => 'raw', 'b' => 'base64']))->toBe([
        ['name' => 'a', 'encoding' => 'raw'],
        ['name' => 'b', 'encoding' => 'base64'],
    ])->and(InverseRows::encodings('x'))->toBe('x');
});

it('turns the map of processing filters into rows, a class name into a filter', function (): void {
    expect(InverseRows::authproc([10 => ['class' => 'core:A', 'x'], 20 => 'core:B', 30 => 5]))->toBe([
        ['priority' => 10, 'filter' => ['class' => 'core:A', 'x']],
        ['priority' => 20, 'filter' => ['class' => 'core:B']],
        ['priority' => 30, 'filter' => 5],
    ])->and(InverseRows::authproc('x'))->toBe('x');
});
