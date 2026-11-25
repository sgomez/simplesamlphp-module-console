<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Application\Publication\PublicationInput;

final class PublicationReader
{
    public function __construct(private readonly \PDO $pdo, private readonly string $prefix)
    {
    }


    public function load(): PublicationInput
    {
        $entities = [];
        $query = 'SELECT ' . EntityRow::COLUMNS . ' FROM ' . $this->table('entity') . ' ORDER BY entity_set, entity_id';
        foreach ($this->rows($query) as $row) {
            $entities[] = EntityRow::hydrate($row);
        }
        $pointer = $this->rows('SELECT current_number, last_number FROM ' . $this->table('pointer'))[0] ?? [];
        $current = is_numeric($pointer['current_number'] ?? null) ? (int) $pointer['current_number'] : null;
        $last = is_numeric($pointer['last_number'] ?? null) ? (int) $pointer['last_number'] : 0;
        $snapshot = $current === null ? [] : $this->rows(
            'SELECT document, created_at FROM ' . $this->table('snapshot') . ' WHERE number = ' . $current,
        );

        return new PublicationInput(
            $entities,
            $current,
            $last,
            self::text($snapshot[0]['document'] ?? null),
            self::text($snapshot[0]['created_at'] ?? null),
        );
    }


    /**
     * @return array{number: int, createdAt: ?string}|null
     */
    public function current(): ?array
    {
        $rows = $this->rows(
            'SELECT s.number, s.created_at FROM ' . $this->table('pointer') . ' p JOIN ' . $this->table('snapshot')
            . ' s ON s.number = p.current_number',
        );

        $number = $rows[0]['number'] ?? null;

        return is_numeric($number)
            ? ['number' => (int) $number, 'createdAt' => self::text($rows[0]['created_at'] ?? null)]
            : null;
    }


    public function currentDocument(): ?string
    {
        $rows = $this->rows(
            'SELECT s.document FROM ' . $this->table('pointer') . ' p JOIN ' . $this->table('snapshot')
            . ' s ON s.number = p.current_number',
        );

        return self::text($rows[0]['document'] ?? null);
    }


    /**
     * @return list<array<array-key, mixed>>
     */
    private function rows(string $sql): array
    {
        $statement = $this->pdo->query($sql);

        return $statement === false ? [] : array_values(array_filter($statement->fetchAll(), is_array(...)));
    }


    private function table(string $name): string
    {
        return $this->prefix . 'console_' . $name;
    }


    private static function text(mixed $value): ?string
    {
        return is_scalar($value) ? (string) $value : null;
    }
}
