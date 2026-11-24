<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use Symfony\Component\Yaml\Yaml;

final class LocalEnvironment
{
    /** @return array<string, mixed> */
    public static function compose(): array
    {
        return Yaml::parseFile(self::path('docker-compose.yml'));
    }


    public static function devFile(string $path): string
    {
        return self::read('docker/simplesamlphp/' . $path);
    }


    public static function read(string $path): string
    {
        return (string) file_get_contents(self::path($path));
    }


    private static function path(string $path): string
    {
        return __DIR__ . '/../../' . $path;
    }
}
