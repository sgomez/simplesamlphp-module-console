<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

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
}
