<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

enum DatabaseState
{
    case Ready;
    case Unreachable;
    case SqliteTooOld;
    case MigrationsPending;
    case ConsoleOlder;
}
