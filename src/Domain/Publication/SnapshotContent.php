<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Publication;

/**
 * What a stored Snapshot holds: the documents by set and entity ID.
 */
final readonly class SnapshotContent
{
    public const int FORMAT_VERSION = 1;

    public const array SETS = ['saml20-sp-remote', 'saml20-idp-remote', 'saml20-idp-hosted'];


    /**
     * @param array<string, array<string, array<array-key, mixed>>> $documents by set, then entity ID
     */
    private function __construct(private array $documents)
    {
    }


    public static function parse(?string $json): self
    {
        $decoded = $json === null ? null : json_decode($json, true);
        $sets = is_array($decoded) ? ($decoded['entities'] ?? null) : null;
        $documents = [];
        foreach (is_array($sets) ? $sets : [] as $set => $list) {
            $documents[(string) $set] = self::index(is_array($list) ? $list : []);
        }

        return new self($documents);
    }


    /**
     * @return list<string>
     */
    public function entityIds(string $set): array
    {
        return array_map(strval(...), array_keys($this->documents[$set] ?? []));
    }


    /**
     * @return array<array-key, mixed>|null
     */
    public function document(string $set, string $entityId): ?array
    {
        return $this->documents[$set][$entityId] ?? null;
    }


    /**
     * @param array<array-key, mixed> $list
     * @return array<string, array<array-key, mixed>>
     */
    private static function index(array $list): array
    {
        $documents = [];
        foreach ($list as $item) {
            $id = is_array($item) ? ($item['entityid'] ?? null) : null;
            $document = is_array($item) ? ($item['document'] ?? null) : null;
            is_scalar($id) && $documents[(string) $id] = is_array($document) ? $document : [];
        }

        return $documents;
    }
}
