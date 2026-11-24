<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use Symfony\Component\Yaml\Yaml;

final class Routes
{
    /**
     * The path of every route that accepts POST, keyed by route name.
     *
     * @return array<string, array{string}>
     */
    public static function post(): array
    {
        $routes = Yaml::parseFile(dirname(__DIR__, 2) . '/routing/routes/routes.yaml');
        $paths = [];
        foreach (is_array($routes) ? $routes : [] as $name => $route) {
            if (is_array($route) && in_array('POST', $route['methods'] ?? [], true)) {
                $paths[(string) $name] = [str_replace('{set}', 'saml20-sp-remote', (string) $route['path'])];
            }
        }

        return $paths;
    }
}
