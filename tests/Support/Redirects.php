<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use Symfony\Component\HttpFoundation\Response;

final class Redirects
{
    private const int LIMIT = 3;


    public static function follow(ConsoleClient $client, Response $response): Response
    {
        for ($hops = 0; $hops < self::LIMIT && $response->isRedirection(); $hops++) {
            $target = (string) $response->headers->get('Location');
            $response = $client->get('/' . ltrim(substr($target, strlen(ConsoleClient::BASE)), '/'));
        }

        return $response;
    }
}
