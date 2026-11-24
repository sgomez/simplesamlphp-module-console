<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Php\PhpExporter;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

it('saves the flat file of an SP that uses every group and stores its document', function (): void {
    [$client, $html] = EntityPages::opened();
    [$entityId, $core] = SpFixtures::flatFile('policy');

    $response = EntityPages::submitNew($client, $html, $entityId, PhpExporter::statement($entityId, $core));
    $stored = $client->database()->query('SELECT document FROM console_entity')->fetchColumn();

    expect($response->getStatusCode())->toBe(302)
        ->and(json_decode((string) $stored, true))->toBe(SpFixtures::document('policy'));
});

it('refuses the shared key and still accepts the rest', function (): void {
    [$client, $html] = EntityPages::opened();
    [$entityId, $core] = SpFixtures::flatFile('policy');
    $core['sharedkey'] = 'secret';

    $response = EntityPages::submitNew($client, $html, $entityId, PhpExporter::statement($entityId, $core));

    expect($response->getStatusCode())->toBe(422)
        ->and(ConsoleClient::body($response))->toContain('not available yet')
        ->and($client->database()->query('SELECT COUNT(*) FROM console_entity')->fetchColumn())->toBe(0);
});
