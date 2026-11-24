<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Configuration;
use SimpleSAML\Metadata\MetaDataStorageHandler;
use SimpleSAML\Metadata\MetaDataStorageSource;

final class CoreSources
{
    public const string SET = 'saml20-sp-remote';


    public static function snapshot(string $dir): MetaDataStorageSource
    {
        Configuration::getInstance();
        Configuration::setPreLoadedConfig(
            Configuration::loadFromArray(['snapshot_dir' => $dir]),
            'module_console.php',
        );

        return MetaDataStorageSource::getSource(['type' => 'console:Snapshot']);
    }


    public static function flatFile(string $fixture): MetaDataStorageSource
    {
        return MetaDataStorageSource::getSource(['type' => 'flatfile', 'file' => self::flatPath($fixture)]);
    }


    public static function flatPath(string $fixture): string
    {
        return (string) getenv('CONSOLE_TEST_DIR') . '/flat-' . $fixture . '.php';
    }


    /**
     * Creates the fixture's entity in the Console and publishes it.
     */
    public static function published(string $fixture): ConsoleClient
    {
        [$entityId] = SpFixtures::flatFile($fixture);
        $client = (new ConsoleClient())->loginAsAdmin();
        PublishFixtures::seed($client, $entityId, SpFixtures::document($fixture));
        PublishFixtures::publish($client, $client->page(PublishFixtures::PATH));

        return $client;
    }


    /**
     * Makes core read the given sources, as `metadata.sources` of config.php would.
     *
     * @param list<array<string, mixed>> $sources
     */
    public static function reads(array $sources): MetaDataStorageHandler
    {
        $config = [];
        include dirname(__DIR__) . '/config/config.php';
        Configuration::setPreLoadedConfig(Configuration::loadFromArray($config + ['metadata.sources' => $sources]));
        MetaDataStorageHandler::clearInternalState();

        return MetaDataStorageHandler::getMetadataHandler();
    }
}
