<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration;

final class M008CreateAuditEntityIndex
{
    public static function define(): Migration
    {
        return Migration::uniform(
            8,
            <<<'SQL'
            CREATE INDEX console_audit_entity ON console_audit (entity_set, entity_id)
            SQL,
        );
    }
}
