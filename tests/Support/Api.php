<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Session;
use Symfony\Component\HttpFoundation\Response;

final class Api
{
    public static function json(Response $response): array
    {
        $body = json_decode((string) $response->getContent(), true, 512, JSON_THROW_ON_ERROR);

        return is_array($body) ? $body : [];
    }


    public static function get(ConsoleClient $client, string $path): array
    {
        $response = $client->api('GET', $path);
        expect($response->getStatusCode())->toBe(200)
            ->and($response->headers->get('Content-Type'))->toBe('application/json');

        return self::json($response);
    }


    /**
     * The body of the 503 the path answers.
     */
    public static function refusal(ConsoleClient $client, string $path = '/session'): array
    {
        $response = $client->api('GET', $path);
        expect($response->getStatusCode())->toBe(503)
            ->and($response->headers->get('Content-Type'))->toBe('application/json');

        return self::json($response);
    }


    /**
     * A POST carrying the session's request-forgery token and a JSON body.
     */
    public static function post(ConsoleClient $client, string $path, array $body = []): Response
    {
        $token = (new CsrfToken(Session::getSessionFromRequest()))->token();

        return $client->api(
            'POST',
            $path,
            ['HTTP_X_CONSOLE_TOKEN' => $token, 'CONTENT_TYPE' => 'application/json'],
            json_encode((object) $body, JSON_THROW_ON_ERROR),
        );
    }


    /**
     * The outcome of Run migrations, logged in as admin.
     */
    public static function migrate(ConsoleClient $client): array
    {
        $response = self::post($client->loginAsAdmin(), '/migrate');
        expect($response->getStatusCode())->toBe(200)
            ->and($response->headers->get('Content-Type'))->toBe('application/json');

        return self::json($response);
    }
}
