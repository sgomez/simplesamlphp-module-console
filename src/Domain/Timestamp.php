<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

final class Timestamp
{
    public static function now(): string
    {
        return gmdate('Y-m-d\TH:i:s\Z');
    }
}
