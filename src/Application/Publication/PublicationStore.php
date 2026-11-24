<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

interface PublicationStore
{
    public function read(): PublicationInput;


    /**
     * The largest Snapshot the engine can store, in bytes; null when it sets no limit (section 4.9).
     */
    public function documentLimit(): ?int;


    /**
     * Runs the transaction of section 4.8. `$decide` receives what the transaction reads and returns the bytes of
     * the new Snapshot, or throws a PublicationRefused. Any lost race ends in PublicationMoved.
     *
     * @param \Closure(\SimpleSAML\Module\console\Application\Publication\PublicationInput): string $decide
     * @return int the number of the new Snapshot
     * @throws \SimpleSAML\Module\console\Application\Publication\PublicationRefused
     */
    public function publish(\Closure $decide, string $identity, ?string $comment): int;
}
