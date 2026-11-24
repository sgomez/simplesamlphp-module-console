<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\Publication\PublicationInput;
use SimpleSAML\Module\console\Application\Publication\PublicationRefused;
use SimpleSAML\Module\console\Tests\Support\Engines;
use SimpleSAML\Module\console\Tests\Support\PublicationDb;

it('lets one of two interleaved Publications win; the other gets the conflict error', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);
    $other = PublicationDb::second($settings);
    $otherResult = null;

    // the other Publication runs whole while this one has read and not yet written
    try {
        $firstResult = $store->publish(function (PublicationInput $in) use ($other, &$otherResult): string {
            try {
                $otherResult = $other->publish(fn (PublicationInput $in): string => '{"by":"other"}', 'other', null);
            } catch (PublicationRefused $refused) {
                $otherResult = $refused;
            }

            return '{"by":"first"}';
        }, 'first', null);
    } catch (PublicationRefused $refused) {
        $firstResult = $refused;
    }

    $results = [$firstResult, $otherResult];
    $won = array_values(array_filter($results, is_int(...)));
    $lost = array_values(array_filter($results, static fn (mixed $r): bool => $r instanceof PublicationRefused));

    expect($won)->toBe([1])
        ->and($lost)->toHaveCount(1)
        ->and($lost[0]->isMoved())->toBeTrue()
        ->and(PublicationDb::snapshots($pdo, $settings))->toHaveCount(1)
        ->and($store->read()->lastNumber)->toBe(1);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());

it('turns a primary-key clash on the Snapshot into the conflict error', function (string $engine): void {
    [$pdo, $store, $settings] = PublicationDb::store($engine);
    $clash = function (PublicationInput $in) use ($pdo, $settings): string {
        $pdo->exec(
            'INSERT INTO ' . $settings->table('snapshot')
            . " VALUES (1, 1, 'x', '{}', NULL, '2026-01-01T00:00:00Z', 'x')",
        );

        return '{"n":1}';
    };

    $publish = fn () => $store->publish($clash, 'alice', null);

    expect($publish)->toThrow(PublicationRefused::class)
        ->and($store->read()->lastNumber)->toBe(0)
        ->and(PublicationDb::snapshots($pdo, $settings))->toBe([]);
    Engines::dropAll($pdo, $settings);
})->with(fn (): array => Engines::datasets());
