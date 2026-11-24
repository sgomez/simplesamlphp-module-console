<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;
use SimpleSAML\Module\console\Domain\Publication\StoredSnapshot;

final class BuildFixtures
{
    public static function dir(): string
    {
        return (string) getenv('CONSOLE_TEST_DIR') . '/snapshots-' . bin2hex(random_bytes(4));
    }


    /**
     * @param array<string, array<string, mixed>> $documents by entity ID
     */
    public static function snapshot(
        int $number,
        array $documents = ['https://a.example.org' => PublishFixtures::VALID],
    ): StoredSnapshot {
        $entities = [];
        foreach ($documents as $id => $document) {
            $entities[] = new StoredEntity('saml20-sp-remote', $id, true, 1, $document);
        }
        $json = SnapshotDocument::build($entities);

        return new StoredSnapshot($number, SnapshotContent::FORMAT_VERSION, hash('sha256', $json), $json);
    }


    /**
     * @return list<string>
     */
    public static function builds(string $dir): array
    {
        $names = array_map(basename(...), glob($dir . '/*-*', GLOB_ONLYDIR) ?: []);
        sort($names);

        return $names;
    }
}
