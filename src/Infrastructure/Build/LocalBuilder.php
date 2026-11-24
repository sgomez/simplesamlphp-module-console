<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Build;

use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Domain\Publication\StoredSnapshot;
use SimpleSAML\Module\console\Domain\Timestamp;
use Symfony\Component\Filesystem\Filesystem;

/**
 * Builds a Snapshot on this node's disk (section 3.5). `current` is switched only once the build is complete.
 */
final class LocalBuilder
{
    private readonly Filesystem $files;


    public function __construct(private readonly string $dir, private readonly string $moduleVersion)
    {
        $this->files = new Filesystem();
    }


    /**
     * @return string the name of the build, `<n>-<b>`
     * @throws \SimpleSAML\Module\console\Infrastructure\Build\BuildFailed
     */
    public function build(StoredSnapshot $snapshot): string
    {
        $this->verify($snapshot);
        $work = $this->dir . '/' . BuildLayout::WORK_PREFIX . bin2hex(random_bytes(6));
        try {
            $this->files->mkdir($this->dir, 0700);
            $this->files->mkdir($work, 0700);
            $this->write($work, $snapshot);
            $name = $snapshot->number . '-' . $this->nextBuild($snapshot->number);
            $this->files->rename($work, $this->dir . '/' . $name);
            $this->switchTo($name);
        } catch (\Throwable $e) {
            $this->discard($work);
            throw $e instanceof BuildFailed ? $e : new BuildFailed($e->getMessage(), 0, $e);
        }

        return $name;
    }


    private function verify(StoredSnapshot $snapshot): void
    {
        if (!hash_equals($snapshot->checksum, hash('sha256', $snapshot->document))) {
            throw new BuildFailed('The checksum does not match the stored bytes of Snapshot ' . $snapshot->number);
        }
        if ($snapshot->formatVersion > SnapshotContent::FORMAT_VERSION) {
            throw new BuildFailed(
                'Snapshot ' . $snapshot->number . ' has format version ' . $snapshot->formatVersion
                . ', and this code knows up to ' . SnapshotContent::FORMAT_VERSION,
            );
        }
    }


    private function write(string $work, StoredSnapshot $snapshot): void
    {
        $content = SnapshotContent::parse($snapshot->document);
        $leftOut = [];
        foreach (SnapshotContent::SETS as $set) {
            $served = ServedSet::translate($content, $set);
            $this->put($work, BuildLayout::setFile($set), $served->php());
            $leftOut = [...$leftOut, ...$served->leftOut];
        }
        $this->put($work, BuildLayout::AUTHSOURCES, "<?php\n\nreturn [];\n");
        $this->put($work, BuildLayout::MANIFEST, json_encode([
            'snapshot' => $snapshot->number,
            'format_version' => $snapshot->formatVersion,
            'checksum' => $snapshot->checksum,
            'built_at' => Timestamp::now(),
            'module_version' => $this->moduleVersion,
            'left_out' => $leftOut,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }


    private function put(string $work, string $file, string $content): void
    {
        $this->files->dumpFile($work . '/' . $file, $content);
        $this->files->chmod($work . '/' . $file, 0600);
    }


    private function nextBuild(int $number): int
    {
        $last = 0;
        foreach ($this->builds() as $name) {
            [$n, $b] = array_map(intval(...), explode('-', $name));
            $last = $n === $number ? max($last, $b) : $last;
        }

        return $last + 1;
    }


    private function switchTo(string $name): void
    {
        $previous = $this->served();
        $temporary = $this->dir . '/' . BuildLayout::WORK_PREFIX . 'current-' . bin2hex(random_bytes(6));
        $this->files->dumpFile($temporary, $name);
        $this->files->chmod($temporary, 0600);
        $this->files->rename($temporary, $this->dir . '/' . BuildLayout::CURRENT, true);
        foreach ($this->builds() as $build) {
            $build === $name || $build === $previous || $this->files->remove($this->dir . '/' . $build);
        }
    }


    private function served(): ?string
    {
        $file = $this->dir . '/' . BuildLayout::CURRENT;
        $name = is_file($file) ? trim((string) file_get_contents($file)) : '';

        return BuildLayout::isBuildName($name) ? $name : null;
    }


    /**
     * @return list<string>
     */
    private function builds(): array
    {
        $names = array_map(basename(...), glob($this->dir . '/*-*', GLOB_ONLYDIR) ?: []);

        return array_values(array_filter($names, BuildLayout::isBuildName(...)));
    }


    private function discard(string $work): void
    {
        try {
            $this->files->remove($work);
        } catch (\Throwable) {
            // nothing more can be done for a work directory that cannot be removed
        }
    }
}
