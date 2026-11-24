<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

enum MigrationOutcome
{
    case Applied;
    case Failed;
    case Concurrent;
}
