<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\MetadataStore;

use SimpleSAML\Logger;
use SimpleSAML\Metadata\MetaDataStorageSource;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Infrastructure\Build\BuildLayout;
use SimpleSAML\Module\console\Infrastructure\Config\ModuleConfig;

/**
 * Serves the managed entities of the Snapshot this node built (sections 3.2 and 5.2). It never touches the
 * database and never lets an error of its own reach core.
 */
final class Snapshot extends MetaDataStorageSource
{
    private ?string $build = null;

    private bool $buildRead = false;

    /** @var array<string, array<array-key, mixed>> */
    private array $cache = [];


    /**
     * @param array<string, mixed> $config
     */
    public function __construct(array $config) // @phpstan-ignore constructor.unusedParameter
    {
        parent::__construct();
    }


    /**
     * @return array<array-key, mixed>
     */
    public function getMetadataSet(string $set): array
    {
        if (!in_array($set, SnapshotContent::SETS, true)) {
            return [];
        }

        return $this->cache[$set] ??= $this->load($set);
    }


    /**
     * @return array<array-key, mixed>
     */
    private function load(string $set): array
    {
        try {
            $build = $this->currentBuild();
            if ($build === null) {
                return [];
            }
            $served = [];
            foreach ($this->read($build . '/' . BuildLayout::setFile($set)) as $entityId => $entry) {
                $served[$entityId] = $entry + ['entityid' => (string) $entityId];
            }

            return $served;
        } catch (\Throwable $e) {
            Logger::warning('console: cannot serve ' . $set . ' from the local Snapshot: ' . $e->getMessage());

            return [];
        }
    }


    private function currentBuild(): ?string
    {
        if ($this->buildRead) {
            return $this->build;
        }
        $this->buildRead = true;
        $dir = ModuleConfig::snapshotDir();
        $file = $dir . '/' . BuildLayout::CURRENT;
        $name = is_readable($file) ? file_get_contents($file) : false;
        if ($name === false || !BuildLayout::isBuildName(trim($name))) {
            Logger::warning('console: the local Snapshot has no usable current build');

            return null;
        }

        return $this->build = $dir . '/' . trim($name);
    }


    /**
     * @return array<array-key, array<array-key, mixed>>
     */
    private function read(string $file): array
    {
        if (!is_file($file)) {
            throw new \RuntimeException('the file ' . basename($file) . ' is missing');
        }
        $entities = (static fn (): mixed => require $file)();
        if (!is_array($entities)) {
            throw new \UnexpectedValueException('the file ' . basename($file) . ' does not return an array');
        }

        return array_filter($entities, is_array(...));
    }
}
