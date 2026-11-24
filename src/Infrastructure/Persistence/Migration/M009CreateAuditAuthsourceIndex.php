<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M009CreateAuditAuthsourceIndex
{
    public static function define(): Migration
    {
        return Migration::uniform(
            9,
            <<<'SQL'
            CREATE INDEX console_audit_authsource ON console_audit (authsource_id)
            SQL,
        );
    }
}
