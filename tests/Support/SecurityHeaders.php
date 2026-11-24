<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Configuration;
use Symfony\Component\HttpFoundation\Response;

final class SecurityHeaders
{
    public static function apply(Response $response): void
    {
        $headers = Configuration::getInstance()
            ->getOptionalArray('headers.security', Configuration::DEFAULT_SECURITY_HEADERS);
        foreach ($headers as $name => $value) {
            if (!$response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }
    }
}
