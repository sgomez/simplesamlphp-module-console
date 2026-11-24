<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Config\DatabaseSettings;
use SimpleSAML\Module\console\Infrastructure\Persistence\MigrationRunner;
use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;
use SimpleSAML\Module\console\Infrastructure\Persistence\PdoPublicationStore;

final class PublicationDb
{
    /**
     * A migrated database of the engine holding one entity, and a store over a first connection to it.
     *
     * @return list<mixed> the connection, the store and the settings
     */
    public static function store(string $engine): array
    {
        $settings = Engines::settings($engine, Engines::prefix());
        $pdo = Engines::connect($settings);
        (new MigrationRunner($pdo, $settings->prefix))->run('setup');
        (new PdoEntityRepository($pdo, $settings->prefix))
            ->create('saml20-sp-remote', 'https://a.example.org', ['a' => 1], 'seed');

        return [$pdo, new PdoPublicationStore($pdo, $settings->prefix, 50), $settings];
    }


    /**
     * A store over a second connection to the same database.
     */
    public static function second(DatabaseSettings $settings): PdoPublicationStore
    {
        return new PdoPublicationStore(Engines::connect($settings), $settings->prefix, 50);
    }


    /**
     * @return list<array<string, mixed>>
     */
    public static function snapshots(\PDO $pdo, DatabaseSettings $settings): array
    {
        $rows = $pdo->query(
            'SELECT number, format_version, checksum, document, comment, created_by FROM '
            . $settings->table('snapshot') . ' ORDER BY number',
        );

        return $rows === false ? [] : array_values($rows->fetchAll());
    }
}
