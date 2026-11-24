<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M005InsertPointerRow
{
    public static function define(): Migration
    {
        return Migration::uniform(
            5,
            <<<'SQL'
            INSERT INTO console_pointer (id, current_number, last_number) VALUES (1, NULL, 0)
            SQL,
        );
    }
}
