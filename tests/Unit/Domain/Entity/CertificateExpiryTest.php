<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\SpWarnings;

it('says nothing while the certificate ends more than 30 days ahead', function (): void {
    expect(SpWarnings::expiryAt('-30 days'))->toBe([])
        ->and(SpWarnings::expiryAt('-31 days'))->toBe([]);
});

it('warns that the certificate expires within 30 days, up to its last second', function (): void {
    $expiring = [['Certificate expiring', 'A certificate expires within 30 days.']];

    expect(SpWarnings::expiryAt('-30 days +1 second'))->toBe($expiring)
        ->and(SpWarnings::expiryAt('+0 seconds'))->toBe($expiring);
});

it('warns that the certificate has expired once its end has passed', function (): void {
    expect(SpWarnings::expiryAt('+1 second'))->toBe([['Certificate expired', 'A certificate has expired.']]);
});

it('ignores certificates it cannot read', function (): void {
    $unreadable = [['pem' => 'garbage'], ['use' => 'both'], 'oops', ['pem' => 42]];

    expect(SpWarnings::expiryAt('+1 second', $unreadable))->toBe([])
        ->and(SpWarnings::expiryAt('+1 second', 'oops'))->toBe([]);
});
