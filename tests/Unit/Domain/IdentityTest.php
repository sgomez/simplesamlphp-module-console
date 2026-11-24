<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Identity;

mutates(Identity::class);

it('is the constant admin when no attribute is configured', function (): void {
    expect(Identity::resolve(null, ['uid' => ['alice']]))->toBe('admin');
});

it('is the first value of the configured attribute', function (): void {
    expect(Identity::resolve('uid', ['uid' => ['alice', 'bob']]))->toBe('alice');
});

it('takes the first value whatever its key', function (): void {
    expect(Identity::resolve('uid', ['uid' => [3 => 'alice']]))->toBe('alice');
});

it('is the constant admin when the attribute is missing, empty or not a string', function (array $attributes): void {
    expect(Identity::resolve('uid', $attributes))->toBe('admin');
})->with([
    'missing' => [[]],
    'no values' => [['uid' => []]],
    'blank' => [['uid' => ['']]],
    'not a list' => [['uid' => 'alice']],
    'not a string' => [['uid' => [42]]],
]);
