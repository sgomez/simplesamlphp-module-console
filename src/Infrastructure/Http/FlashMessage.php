<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Session;

final class FlashMessage
{
    private const string TYPE = 'console:flash';

    private const string ID = 'message';

    private const string NOTICE = 'notice';


    public function __construct(private readonly Session $session)
    {
    }


    public function put(string $message): void
    {
        $this->session->setData(self::TYPE, self::ID, $message, Session::DATA_TIMEOUT_SESSION_END);
    }


    public function take(): ?string
    {
        $message = $this->session->getData(self::TYPE, self::ID);
        if ($message === null) {
            return null;
        }
        $this->session->deleteData(self::TYPE, self::ID);

        return is_string($message) ? $message : null;
    }


    public function putNotice(string $notice): void
    {
        $this->session->setData(self::TYPE, self::NOTICE, $notice, Session::DATA_TIMEOUT_SESSION_END);
    }


    public function takeNotice(): ?string
    {
        $notice = $this->session->getData(self::TYPE, self::NOTICE);
        if ($notice === null) {
            return null;
        }
        $this->session->deleteData(self::TYPE, self::NOTICE);

        return is_string($notice) ? $notice : null;
    }
}
