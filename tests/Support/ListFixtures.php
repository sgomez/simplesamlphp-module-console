<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Publication\EntityState;
use SimpleSAML\Module\console\Domain\Publication\PendingChange;
use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;

final class ListFixtures
{
    private const string SET = 'saml20-sp-remote';


    public static function filtered(): array
    {
        $entities = [
            ListedEntities::listedSp('https://new.example.org'),
            ListedEntities::listedSp('https://modified.example.org'),
            ListedEntities::listedSp('https://live.example.org'),
            ListedEntities::listedSp('https://off.example.org', enabled: false),
            new StoredEntity(self::SET, 'https://bad.example.org', true, 1, null, 'not valid JSON'),
            ListedEntities::listedSp('https://other.example.org'),
        ];
        $states = [
            new PendingChange(self::SET, 'https://new.example.org', EntityState::Unpublished, 1),
            new PendingChange(self::SET, 'https://modified.example.org', EntityState::Modified, 1),
            new PendingChange(self::SET, 'https://live.example.org', EntityState::UpToDate, 1),
            new PendingChange(self::SET, 'https://bad.example.org', EntityState::Unreadable, 1),
            new PendingChange('saml20-idp-remote', 'https://other.example.org', EntityState::Unpublished, 1),
            new PendingChange(self::SET, 'https://gone.example.org', EntityState::Deleted, null),
        ];
        $warned = ['https://modified.example.org', 'https://off.example.org', 'https://bad.example.org'];

        return [ListedEntities::warnedPage($warned, ...$entities), $states];
    }


    /**
     * Up to date, Modified with a warning, To be withdrawn, Unpublished, Unpublished with a warning, Not live.
     */
    public static function client(): ConsoleClient
    {
        $client = (new ConsoleClient())->loginAsAdmin();
        $live = PublishFixtures::VALID + ['name' => ['en' => 'Live']];
        PublishFixtures::seed($client, 'https://live.example.org', $live);
        PublishFixtures::seed($client, 'https://modified.example.org');
        PublishFixtures::seed($client, 'https://withdrawn.example.org');
        PublishFixtures::publish($client);
        (new PdoEntityRepository($client->database(), ''))->update(
            self::SET,
            'https://modified.example.org',
            1,
            PublishFixtures::VALID + ['sign.logout' => false],
            'admin',
        );
        PublishFixtures::seed($client, 'https://new.example.org');
        PublishFixtures::seed($client, 'my-sp');
        PublishFixtures::seed($client, 'https://off.example.org');
        $client->database()->exec(
            "UPDATE console_entity SET enabled = 0 WHERE entity_id IN ('https://withdrawn.example.org', "
            . "'https://off.example.org')",
        );

        return $client;
    }


    public static function certificate(int $days): string
    {
        $key = openssl_pkey_new(['private_key_bits' => 2048, 'private_key_type' => OPENSSL_KEYTYPE_RSA]);
        $csr = openssl_csr_new(['commonName' => 'test key, not for use'], $key);
        openssl_x509_export(openssl_csr_sign($csr, null, $key, $days), $pem);

        return $pem;
    }
}
