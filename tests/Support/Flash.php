<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Session;

final class Flash
{
    public static function taken(): ?string
    {
        return (new FlashMessage(Session::getSessionFromRequest()))->take();
    }
}
