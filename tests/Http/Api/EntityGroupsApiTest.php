<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Php\PhpExporter;
use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityDb;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

it('saves the flat file of an SP that uses every group and stores its document', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    [$entityId, $core] = SpFixtures::flatFile('policy');
    EntityDb::seed($client, $entityId);

    $response = EntityApi::save($client, PhpExporter::statement($entityId, $core), id: $entityId);
    $stored = $client->database()->query('SELECT document FROM console_entity')->fetchColumn();

    expect($response->getStatusCode())->toBe(200)
        ->and(json_decode((string) $stored, true))->toBe(SpFixtures::document('policy'));
});

it('refuses the shared key and still accepts the rest', function (): void {
    $client = (new ConsoleClient())->loginAsAdmin();
    [$entityId, $core] = SpFixtures::flatFile('policy');
    EntityDb::seed($client, $entityId);
    $core['sharedkey'] = 'secret';

    $response = EntityApi::save($client, PhpExporter::statement($entityId, $core), id: $entityId);

    expect($response->getStatusCode())->toBe(422)
        ->and(array_column(Api::json($response)['errors'], 'message'))
            ->toContain("The option 'sharedkey' is not available yet.")
        ->and(EntityApi::version($client))->toBe(1);
});
