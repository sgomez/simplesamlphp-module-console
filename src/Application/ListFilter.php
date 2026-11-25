<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

enum ListFilter: string
{
    case All = 'all';
    case NotLive = 'not-live';
    case WithWarnings = 'warnings';
}
