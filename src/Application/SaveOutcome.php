<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

enum SaveOutcome
{
    case Saved;
    case Invalid;
    case AlreadyExists;
    case Conflict;
}
