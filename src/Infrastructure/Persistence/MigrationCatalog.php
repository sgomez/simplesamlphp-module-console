<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration as Step;

final class MigrationCatalog
{
    /**
     * @return list<\SimpleSAML\Module\console\Infrastructure\Persistence\Migration>
     */
    public static function all(): array
    {
        return [
            Step\M001CreateEntity::define(),
            Step\M002CreateAuthsource::define(),
            Step\M003CreateSnapshot::define(),
            Step\M004CreatePointer::define(),
            Step\M005InsertPointerRow::define(),
            Step\M006CreateNode::define(),
            Step\M007CreateAudit::define(),
            Step\M008CreateAuditEntityIndex::define(),
            Step\M009CreateAuditAuthsourceIndex::define(),
        ];
    }
}
