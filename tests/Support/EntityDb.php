<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Application\SaveEntity;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Persistence\MigrationRunner;
use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;

final class EntityDb
{
    public const string SET = 'saml20-sp-remote';


    public static function repository(string $engine): array
    {
        [$pdo, $settings] = Db::fresh($engine);
        (new MigrationRunner($pdo, $settings->prefix))->run('setup');

        return [$pdo, new PdoEntityRepository($pdo, $settings->prefix), $settings];
    }


    /**
     * @return list<array<string, mixed>> the rows of the Audit trail but the migration ones
     */
    public static function audit(\PDO $pdo, string $table): array
    {
        $rows = $pdo->query(
            'SELECT identity, action, object_type, entity_set, entity_id, document FROM ' . $table
            . " WHERE action <> 'migrate' ORDER BY id",
        );

        return $rows === false ? [] : array_values($rows->fetchAll());
    }


    public static function saver(): array
    {
        [, $repository] = self::repository('sqlite');

        return [new SaveEntity($repository, new SpRemote()), $repository];
    }


    /**
     * @param array<string, mixed> $extra
     */
    public static function seed(ConsoleClient $client, string $id, array $extra = []): void
    {
        $endpoint = ['Binding' => 'urn:a:b', 'Location' => 'https://a.example.org/acs'];
        $repository = new PdoEntityRepository($client->database(), '');
        $repository->create(self::SET, $id, ['AssertionConsumerService' => [$endpoint]] + $extra, 'seed');
    }


    public static function seedUnreadable(ConsoleClient $client): void
    {
        $client->database()->exec(
            "INSERT INTO console_entity VALUES ('" . self::SET . "', 'https://bad.example.org', 1, '{oops', 1, NULL, "
            . "'x', 'x')",
        );
    }
}
