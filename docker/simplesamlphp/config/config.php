<?php

// Local development node. Plain HTTP, throwaway secrets.
$config = [
    // Host-relative, so the node answers both on its own port and through Vite (SPEC.md section 12.7).
    'baseurlpath' => '/simplesaml/',
    'application' => ['baseURL' => 'http://localhost:8080'],
    'secretsalt' => 'dev-only-salt-not-a-secret',
    // bcrypt of 'admin'
    'auth.adminpassword' => '$2y$12$VwJCrZPRqI1u4XhqYVHBvOCRghNWFbkgI3OAbVG2SbcIWkDisZKh6',
    'admin.protectindexpage' => false,
    'cachedir' => '/var/cache/simplesamlphp',
    'tempdir' => '/tmp/simplesamlphp',
    'datadir' => '/var/simplesamlphp/data/',
    'loggingdir' => '/var/simplesamlphp/log/',
    'technicalcontact_email' => 'dev@example.org',
    'session.cookie.secure' => false,
    'enable.saml20-idp' => true,
    'store.type' => 'phpsession',
    'logging.handler' => 'errorlog',
    'logging.level' => SimpleSAML\Logger::INFO,
    'module.enable' => [
        'admin' => true,
        'core' => true,
        'cron' => true,
        'saml' => true,
        'exampleauth' => true,
        'console' => true,
    ],
    'database.dsn' => 'mysql:host=mariadb;dbname=console_dev;charset=utf8mb4',
    'database.username' => 'console',
    'database.password' => 'console',
    'metadata.sources' => [
        ['type' => 'console:Snapshot'],
        ['type' => 'flatfile'],
    ],
];
