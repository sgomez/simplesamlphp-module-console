<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Http\EntityWarnings;
use SimpleSAML\Module\console\Tests\Support\ListFixtures;

it('labels the certificate that expires first with its day count, one day in the singular', function (): void {
    $document = ['certificates' => [
        ['pem' => ListFixtures::certificate(5), 'use' => 'both'],
        ['pem' => 'not a certificate', 'use' => 'both'],
        ['pem' => ListFixtures::certificate(1), 'use' => 'both'],
    ]];
    $soon = ['certificates' => [['pem' => ListFixtures::certificate(3), 'use' => 'both']]];

    $labels = array_column((new EntityWarnings())->labels('https://sp.example.org', $document), 'label');

    expect($labels)->toBe(['Certificate expires in 1 day'])
        ->and(array_column((new EntityWarnings())->labels('https://sp.example.org', $soon), 'label'))
        ->toBe(['Certificate expires in 3 days']);
});
