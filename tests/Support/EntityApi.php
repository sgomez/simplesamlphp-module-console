<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Session;
use Symfony\Component\HttpFoundation\Response;

final class EntityApi
{
    public const string ID = 'https://sp.example.org';

    public const string ENTITY = '/entities/saml20-sp-remote/entity?entityid=https%3A%2F%2Fsp.example.org';

    public const string SAVE = '/entities/saml20-sp-remote/save';

    public const string VALIDATE = '/entities/saml20-sp-remote/validate';

    public const string DELETE = '/entities/saml20-sp-remote/delete';


    /**
     * A logged-in client holding the service provider "Example" at version 1.
     */
    public static function existing(): ConsoleClient
    {
        $client = (new ConsoleClient())->loginAsAdmin();
        EntityDb::seed($client, self::ID, ['name' => ['en' => 'Example']]);

        return $client;
    }


    public static function post(ConsoleClient $client, string $path, array $body): Response
    {
        $token = (new CsrfToken(Session::getSessionFromRequest()))->token();

        return $client->api(
            'POST',
            $path,
            ['HTTP_X_CONSOLE_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'],
            json_encode($body, JSON_THROW_ON_ERROR),
        );
    }


    public static function save(ConsoleClient $client, string $php, int $version = 1, string $id = self::ID): Response
    {
        return self::post($client, self::SAVE, ['entityid' => $id, 'version' => $version, 'php' => $php]);
    }


    /**
     * A save without a version: a create, its entity ID taken from the text.
     */
    public static function create(ConsoleClient $client, string $php): Response
    {
        return self::post($client, self::SAVE, ['php' => $php]);
    }


    public static function validate(ConsoleClient $client, string $php, string $id = self::ID): Response
    {
        return self::post($client, self::VALIDATE, ['entityid' => $id, 'php' => $php]);
    }


    public static function delete(ConsoleClient $client, string $id): Response
    {
        return self::post($client, self::DELETE, ['entityid' => $id]);
    }


    public static function noStore(Response $response): bool
    {
        return str_contains((string) $response->headers->get('Cache-Control'), 'no-store');
    }


    public static function version(ConsoleClient $client): int
    {
        return (int) $client->database()->query('SELECT version FROM console_entity')->fetchColumn();
    }
}
