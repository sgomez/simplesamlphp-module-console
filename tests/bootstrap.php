<?php

declare(strict_types=1);

$root = dirname(__DIR__);
require_once $root . '/vendor/autoload.php';

$work = sys_get_temp_dir() . '/console-tests-' . getmypid();
foreach (['tmp', 'cache', 'log'] as $sub) {
    mkdir($work . '/' . $sub, 0700, true);
}
putenv('CONSOLE_TEST_DIR=' . $work);
putenv('SIMPLESAMLPHP_CONFIG_DIR=' . __DIR__ . '/config');
register_shutdown_function(static function () use ($work): void {
    exec('rm -rf ' . escapeshellarg($work));
});

$link = $root . '/vendor/simplesamlphp/simplesamlphp/modules/console';
if (!is_link($link) || readlink($link) !== $root) {
    @unlink($link);
    symlink($root, $link);
}

\SAML2\Compat\ContainerSingleton::setContainer(new \SimpleSAML\Compat\SspContainer());
