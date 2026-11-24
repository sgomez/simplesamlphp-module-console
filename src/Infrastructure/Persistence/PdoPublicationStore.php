<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Application\Publication\PublicationInput;
use SimpleSAML\Module\console\Application\Publication\PublicationRefused;
use SimpleSAML\Module\console\Application\Publication\PublicationStore;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Domain\Timestamp;

final class PdoPublicationStore implements PublicationStore
{
    private readonly AuditTrail $audit;

    private readonly PublicationReader $reader;

    private bool $open = false;


    public function __construct(
        private readonly \PDO $pdo,
        private readonly string $prefix,
        private readonly int $busyTimeoutMs = 5000,
    ) {
        $this->audit = new AuditTrail($pdo, $prefix);
        $this->reader = new PublicationReader($pdo, $prefix);
    }


    public function read(): PublicationInput
    {
        return $this->reader->load();
    }


    public function documentLimit(): ?int
    {
        if ($this->driver() !== 'mysql') {
            return null;
        }
        $statement = $this->pdo->query('SELECT @@max_allowed_packet');
        $limit = $statement === false ? null : $statement->fetchColumn();

        return is_numeric($limit) ? (int) $limit : null;
    }


    public function publish(\Closure $decide, string $identity, ?string $comment): int
    {
        try {
            $this->begin();
            $this->open = true;
            $input = $this->reader->load();
            $document = $decide($input);
            $number = $input->lastNumber + 1;
            $this->takeNumber($input->lastNumber, $number);
            $this->insertSnapshot($number, $document, $comment, $identity);
            $this->audit->recordPublication($identity, $input->currentNumber, $number, $comment);
            $this->pdo->exec('COMMIT');
            $this->open = false;

            return $number;
        } catch (\PDOException $e) {
            $this->rollBack();
            throw ConflictShapes::isConflict($e) || ConflictShapes::isDuplicateKey($e)
                ? PublicationRefused::moved($e)
                : $e;
        } catch (\Throwable $e) {
            $this->rollBack();
            throw $e;
        }
    }


    /**
     * REPEATABLE READ, so that entities and the pointer describe one instant; on SQLite a write lock from the
     * start, so that the loser of a race waits and then fails (section 4.8).
     */
    private function begin(): void
    {
        switch ($this->driver()) {
            case 'sqlite':
                $this->pdo->exec('PRAGMA busy_timeout = ' . $this->busyTimeoutMs);
                $this->pdo->exec('BEGIN IMMEDIATE');
                break;
            case 'pgsql':
                $this->pdo->exec('BEGIN');
                $this->pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
                break;
            default:
                $this->pdo->exec('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
                $this->pdo->exec('START TRANSACTION');
        }
    }


    private function rollBack(): void
    {
        if (!$this->open) {
            return;
        }
        $this->open = false;
        try {
            $this->pdo->exec('ROLLBACK');
        } catch (\PDOException) {
            // the engine already ended the transaction
        }
    }


    private function takeNumber(int $last, int $number): void
    {
        $statement = $this->pdo->prepare(
            'UPDATE ' . $this->prefix . 'console_pointer SET last_number = ?, current_number = ? '
            . 'WHERE id = 1 AND last_number = ?',
        );
        $statement->execute([$number, $number, $last]);
        if ($statement->rowCount() !== 1) {
            throw PublicationRefused::moved();
        }
    }


    private function insertSnapshot(int $number, string $document, ?string $comment, string $identity): void
    {
        $this->pdo->prepare(
            'INSERT INTO ' . $this->prefix . 'console_snapshot '
            . '(number, format_version, checksum, document, comment, created_at, created_by) '
            . 'VALUES (?, ?, ?, ?, ?, ?, ?)',
        )->execute([
            $number,
            SnapshotContent::FORMAT_VERSION,
            hash('sha256', $document),
            $document,
            $comment,
            Timestamp::now(),
            $identity,
        ]);
    }


    private function driver(): string
    {
        $driver = $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);

        return is_string($driver) ? $driver : '';
    }
}
