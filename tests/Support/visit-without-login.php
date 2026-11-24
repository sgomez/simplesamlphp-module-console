<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;

require __DIR__ . '/../bootstrap.php';

$client = new ConsoleClient();
if (($argv[1] ?? '') === 'unreachable') {
    $client->withUnreachableDatabase();
}
$client->get('/');
