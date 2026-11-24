<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Session;

final class CsrfToken
{
    private const string TYPE = 'console:csrf';

    private const string ID = 'token';


    public function __construct(private readonly Session $session)
    {
    }


    public function token(): string
    {
        $token = $this->session->getData(self::TYPE, self::ID);
        if (!is_string($token) || $token === '') {
            $token = bin2hex(random_bytes(32));
            $this->session->setData(self::TYPE, self::ID, $token, Session::DATA_TIMEOUT_SESSION_END);
        }

        return $token;
    }


    public function isValid(?string $submitted): bool
    {
        return $submitted !== null && hash_equals($this->token(), $submitted);
    }
}
