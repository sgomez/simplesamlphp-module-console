<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\DatabaseStatus;

final readonly class DatabaseReading
{
    /**
     * @param string|null $failure the driver's message when the database could not be reached
     */
    public function __construct(
        public DatabaseStatus $status,
        public ?string $failure = null,
    ) {
    }
}
