<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use Symfony\Component\Yaml\Yaml;

final class Routes
{
    /** @var array<string, array{method: string, path: string}>|null */
    private static ?array $api = null;


    /**
     * The path below api/ of every API route that accepts POST, keyed by route name.
     *
     * @return array<string, array{string}>
     */
    public static function apiPost(): array
    {
        $post = array_filter(self::api(), static fn (array $route): bool => $route[0] === 'POST');

        return array_map(static fn (array $route): array => [$route[1]], $post);
    }


    /**
     * The method and the path under api/ of every API route, keyed by route name; {set} is filled in.
     *
     * @return array<string, array{string, string}>
     */
    public static function api(): array
    {
        return array_map(static fn (array $route): array => [$route['method'], $route['path']], self::parsed());
    }


    /**
     * @return array<string, array{method: string, path: string}>
     */
    private static function parsed(): array
    {
        if (self::$api !== null) {
            return self::$api;
        }
        $routes = Yaml::parseFile(dirname(__DIR__, 2) . '/routing/routes/routes.yaml');
        self::$api = [];
        foreach (is_array($routes) ? $routes : [] as $name => $route) {
            $path = is_array($route) ? (string) $route['path'] : '';
            if (str_starts_with($path, '/api/')) {
                self::$api[(string) $name] = [
                    'method' => (string) ($route['methods'][0] ?? 'GET'),
                    'path' => str_replace('{set}', 'saml20-sp-remote', substr($path, 4)),
                ];
            }
        }

        return self::$api;
    }
}
