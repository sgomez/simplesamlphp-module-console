<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ConsoleClient;

require __DIR__ . '/../bootstrap.php';

(new ConsoleClient())->get('/');
