<?php

declare(strict_types=1);

$dir = (string) getenv('CONSOLE_TEST_DIR');

$config = [
    'baseurlpath' => 'http://localhost/simplesaml/',
    'secretsalt' => 'test-salt-not-a-secret',
    'auth.adminpassword' => 'test-only',
    'technicalcontact_email' => 'na@example.org',
    'tempdir' => $dir . '/tmp',
    'cachedir' => $dir . '/cache',
    'loggingdir' => $dir . '/log',
    'logging.handler' => 'errorlog',
    'logging.level' => 4,
    'store.type' => 'phpsession',
    'module.enable' => [
        'admin' => true,
        'core' => true,
        'cron' => true,
        'console' => true,
    ],
];
