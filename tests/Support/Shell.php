<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

final class Shell
{
    public const string BUILD = __DIR__ . '/../../public/assets/app/';


    public static function manifest(): array
    {
        $manifest = (string) file_get_contents(self::BUILD . '.vite/manifest.json');

        return json_decode($manifest, true, 512, JSON_THROW_ON_ERROR);
    }


    public static function token(string $html): string
    {
        preg_match('/<meta name="console-token" content="([^"]*)">/', $html, $matches);

        return $matches[1] ?? '';
    }


    public static function scripts(string $html): array
    {
        preg_match_all('/<script type="module" src="([^"]+)"><\/script>/', $html, $matches);
        preg_match_all('/<script/', $html, $all);

        return count($all[0]) === count($matches[1]) ? $matches[1] : ['unexpected script'];
    }


    public static function stylesheets(string $html): array
    {
        preg_match_all('/<link rel="stylesheet" href="([^"]+)">/', $html, $matches);
        preg_match_all('/rel="stylesheet"/', $html, $all);

        return count($all[0]) === count($matches[1]) ? $matches[1] : ['unexpected stylesheet'];
    }
}
