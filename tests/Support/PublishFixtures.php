<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Persistence\PdoEntityRepository;
use Symfony\Component\HttpFoundation\Response;

final class PublishFixtures
{
    public const string PATH = '/publication';

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


    public static function hash(ConsoleClient $client): string
    {
        return (string) Api::get($client, self::PATH)['hash'];
    }


    /**
     * Sends the confirming request, with the hash of the screen as it stands unless another one is given.
     */
    public static function publish(ConsoleClient $client, ?string $hash = null, string $comment = ''): Response
    {
        $body = ['hash' => $hash ?? self::hash($client), 'comment' => $comment];

        return self::send($client, (string) json_encode($body));
    }


    public static function send(ConsoleClient $client, string $body): Response
    {
        return $client->api('POST', self::PATH, [
            'HTTP_X_CONSOLE_TOKEN' => Shell::token($client->page()),
            'CONTENT_TYPE' => 'application/json',
        ], $body);
    }


    public static function snapshots(ConsoleClient $client): int
    {
        return EntityPages::count($client, 'console_snapshot');
    }


    public static function delete(ConsoleClient $client, string $entityId): void
    {
        $client->post('/entities/saml20-sp-remote/delete', [
            '_token' => EntityPages::field($client->page(EntityPages::NEW), '_token'),
            'entityid' => $entityId,
        ]);
    }
}
