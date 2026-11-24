<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

interface ProcessingFilterClasses
{
    /**
     * Whether the `class` of a processing filter resolves on the node that publishes.
     */
    public function resolves(string $class): bool;
}
