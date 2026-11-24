<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Publication;

enum EntityState: string
{
    case Unpublished = 'Unpublished';
    case UpToDate = 'Up to date';
    case Modified = 'Modified';
    case Deleted = 'Deleted';
    case Unreadable = 'Unreadable';


    public function isPending(): bool
    {
        return $this !== self::UpToDate;
    }
}
