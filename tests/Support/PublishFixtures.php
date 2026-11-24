<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;
use Symfony\Component\HttpFoundation\Response;

final class PublishFixtures
{
    public const string PATH = '/publish';

    public const array VALID = ['AssertionConsumerService' => [[
        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        'Location' => 'https://a.example.org/acs',
    ]]];


    /**
     * @param array<string, mixed> $document
     */
    public static function seed(ConsoleClient $client, string $id, array $document = self::VALID): void
    {
        (new PdoEntityRepository($client->database(), ''))->create('saml20-sp-remote', $id, $document, 'seed');
    }


    /**
     * Submits the confirmation screen the given HTML came from.
     */
    public static function publish(ConsoleClient $client, string $html, string $comment = ''): Response
    {
        return $client->post(self::PATH, [
            '_token' => EntityPages::field($html, '_token'),
            'hash' => EntityPages::field($html, 'hash'),
            'comment' => $comment,
        ]);
    }


    public static function snapshots(ConsoleClient $client): int
    {
        return EntityPages::count($client, 'console_snapshot');
    }


    public static function delete(ConsoleClient $client, string $entityId): void
    {
        $client->post('/entities/saml20-sp-remote/delete', [
            '_token' => EntityPages::field($client->page(EntityPages::LIST), '_token'),
            'entityid' => $entityId,
        ]);
    }
}
