<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;

final class FrontendAssets
{
    private const string ENTRY = 'src/main.tsx';

    private const string STYLESHEET = 'src/console.css';

    private const string BUILD = __DIR__ . '/../../../public/assets/app/';


    /**
     * The scripts and the stylesheet the page shell references: the built files named by Vite's manifest, or
     * the development server's paths on the same origin when `dev_server` is set.
     *
     * @return array{scripts: list<string>, stylesheets: list<string>}
     */
    public function references(): array
    {
        $base = Module::getModuleURL('console/assets/app/');
        if (ModuleConfig::devServer()) {
            return [
                'scripts' => [$base . '@vite/client', $base . 'dev/refresh.ts', $base . self::ENTRY],
                'stylesheets' => [$base . self::STYLESHEET],
            ];
        }

        return [
            'scripts' => [$base . $this->built(self::ENTRY)],
            'stylesheets' => [$base . $this->built(self::STYLESHEET)],
        ];
    }


    private function built(string $source): string
    {
        $manifest = json_decode((string) file_get_contents(self::BUILD . '.vite/manifest.json'), true);
        $file = is_array($manifest) && is_array($manifest[$source] ?? null) ? $manifest[$source]['file'] ?? null : null;
        if (!is_string($file)) {
            throw new \RuntimeException('The Console front end is not built: ' . $source . ' is not in the manifest.');
        }

        return $file;
    }
}
