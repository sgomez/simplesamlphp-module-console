<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain;

final readonly class DatabaseStatus
{
    /**
     * @param list<int> $missing migration numbers not applied yet
     */
    private function __construct(
        public DatabaseState $state,
        public ?string $sqliteVersion = null,
        public int $known = 0,
        public int $highest = 0,
        public array $missing = [],
    ) {
    }


    public static function unreachable(): self
    {
        return new self(DatabaseState::Unreachable);
    }


    public static function sqliteTooOld(string $version): self
    {
        return new self(DatabaseState::SqliteTooOld, sqliteVersion: $version);
    }


    /**
     * @param list<int>|null $applied the applied numbers, or null when the versions table is missing
     * @param int $known the number of the last migration the code knows
     */
    public static function ofSchema(?array $applied, int $known): self
    {
        $applied ??= [];
        $highest = $applied === [] ? 0 : max($applied);
        if ($highest > $known) {
            return new self(DatabaseState::ConsoleOlder, known: $known, highest: $highest);
        }

        $missing = array_values(array_diff(range(1, $known), $applied));

        return new self(
            $missing === [] ? DatabaseState::Ready : DatabaseState::MigrationsPending,
            known: $known,
            highest: $highest,
            missing: $missing,
        );
    }
}
