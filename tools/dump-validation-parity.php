<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Tests\Support\ValidationParity;

require dirname(__DIR__) . '/vendor/autoload.php';

file_put_contents(dirname(__DIR__) . '/' . ValidationParity::FILE, ValidationParity::json());
