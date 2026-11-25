<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Infrastructure\Persistence\Migration as Step;

final class MigrationCatalog
{
    private const array TITLES = [
        1 => 'Create console_entity',
        2 => 'Create console_authsource',
        3 => 'Create console_snapshot',
        4 => 'Create console_pointer',
        5 => 'Insert the single row of console_pointer',
        6 => 'Create console_node',
        7 => 'Create console_audit',
        8 => 'Create the index console_audit_entity',
        9 => 'Create the index console_audit_authsource',
    ];


    /**
     * What the migration does, as the administrator reads it.
     */
    public static function title(int $number): string
    {
        return self::TITLES[$number] ?? 'Migration ' . $number;
    }


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
