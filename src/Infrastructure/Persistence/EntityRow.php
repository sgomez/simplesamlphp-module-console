<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Persistence;

use SimpleSAML\Module\console\Domain\Entity\StoredEntity;

final class EntityRow
{
    public const string COLUMNS = 'entity_set, entity_id, enabled, document, version';


    /**
     * @param array<array-key, mixed> $row
     */
    public static function hydrate(array $row): StoredEntity
    {
        $decoded = json_decode(self::text($row['document'] ?? ''), true);
        $loadable = is_array($decoded) && json_last_error() === JSON_ERROR_NONE;
        /** @var array<string, mixed>|null $document */
        $document = $loadable ? $decoded : null;

        return new StoredEntity(
            self::text($row['entity_set'] ?? ''),
            self::text($row['entity_id'] ?? ''),
            self::text($row['enabled'] ?? 0) === '1',
            (int) self::text($row['version'] ?? 0),
            $document,
            $loadable ? null : 'The stored document is not valid JSON: ' . json_last_error_msg() . '.',
        );
    }


    private static function text(mixed $value): string
    {
        return is_scalar($value) ? (string) $value : '';
    }
}
