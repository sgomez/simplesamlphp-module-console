<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Core;

use SimpleSAML\Auth\ProcessingFilter;
use SimpleSAML\Module;
use SimpleSAML\Module\console\Application\Publication\ProcessingFilterClasses;

final class CoreProcessingFilterClasses implements ProcessingFilterClasses
{
    public function resolves(string $class): bool
    {
        try {
            Module::resolveClass($class, 'Auth\Process', ProcessingFilter::class);

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
