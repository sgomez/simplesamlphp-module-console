<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\MigrationOutcome;
use SimpleSAML\Module\console\Domain\MigrationReport;

final class MigrationRunner
{
    private const string LOST_RACE = '/already exists|duplicate (key|entry)|unique constraint/i';

    /** The migration that creates the Audit trail. */
    private const int AUDIT_MIGRATION = 7;


    private readonly string $driver;

    private readonly VersionTable $versions;

    /** @var list<\SimpleSAML\Module\console\Infrastructure\Persistence\Migration> */
    private readonly array $migrations;


    /**
     * @param list<\SimpleSAML\Module\console\Infrastructure\Persistence\Migration>|null $migrations
     * @param \Closure(int): void|null $beforeEach called before each migration, so tests can interleave a rival run
     */
    public function __construct(
        private readonly \PDO $pdo,
        private readonly string $prefix,
        ?array $migrations = null,
        private readonly ?\Closure $beforeEach = null,
    ) {
        $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        $this->driver = is_string($driver) ? $driver : '';
        $this->versions = new VersionTable($pdo, $prefix);
        $this->migrations = $migrations ?? MigrationCatalog::all();
    }


    public function run(string $identity): MigrationReport
    {
        $applied = [];
        $current = null;
        try {
            $this->versions->create();
            $done = $this->versions->applied();
            foreach ($this->migrations as $migration) {
                if (!in_array($migration->number, $done, true)) {
                    $current = $migration->number;
                    $this->apply($migration);
                    $applied[] = $migration->number;
                }
            }
        } catch (\PDOException $e) {
            return $this->record($identity, $this->stopped($e, $current, $applied));
        }

        return $this->record($identity, new MigrationReport(MigrationOutcome::Applied, $applied));
    }


    private function apply(Migration $migration): void
    {
        if ($this->beforeEach !== null) {
            ($this->beforeEach)($migration->number);
        }
        $statement = $migration->sqlFor($this->driver, $this->prefix);
        if ($this->driver === 'mysql') {
            $this->pdo->exec($statement);
            $this->versions->record($migration->number);

            return;
        }

        $this->pdo->beginTransaction();
        $this->pdo->exec($statement);
        $this->versions->record($migration->number);
        $this->pdo->commit();
    }


    /**
     * @param list<int> $applied
     */
    private function stopped(\PDOException $e, ?int $number, array $applied): MigrationReport
    {
        if ($this->pdo->inTransaction()) {
            $this->pdo->rollBack();
        }
        if ($number !== null && $this->lostRace($e, $number)) {
            return new MigrationReport(
                MigrationOutcome::Concurrent,
                $applied,
                $number,
                'Another run is applying the migrations at the same time.',
            );
        }

        return new MigrationReport(MigrationOutcome::Failed, $applied, $number, $e->getMessage());
    }


    private function lostRace(\PDOException $e, int $number): bool
    {
        try {
            if (in_array($number, $this->versions->applied(), true)) {
                return true;
            }
        } catch (\PDOException) {
            return false;
        }

        return preg_match(self::LOST_RACE, $e->getMessage()) === 1;
    }


    private function record(string $identity, MigrationReport $report): MigrationReport
    {
        if ($report->applied === []) {
            return $report;
        }

        try {
            $applied = $this->versions->applied();
            if (in_array(self::AUDIT_MIGRATION, $applied, true)) {
                (new AuditTrail($this->pdo, $this->prefix))->recordMigration($identity, max($applied));
            }
        } catch (\PDOException $e) {
            return new MigrationReport(
                MigrationOutcome::Failed,
                $report->applied,
                null,
                'The migrations were applied but the Audit trail row failed: ' . $e->getMessage(),
            );
        }

        return $report;
    }
}
