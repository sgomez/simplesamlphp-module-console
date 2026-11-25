<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;
use SimpleSAML\Module\console\Domain\Php\PhpReader;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;

/**
 * The JSON of an entity not saved yet, whose entity ID the text holds.
 */
final class NewEntityJson
{
    public function __construct(private readonly Repositories $repositories)
    {
    }


    /**
     * The starter text, its entity ID left for the administrator to write.
     */
    public static function starter(): JsonResponse
    {
        return EntityJson::respond([
            'entityId' => '',
            'name' => null,
            'version' => 0,
            'state' => null,
            'unreadable' => false,
            'error' => null,
            'php' => "\$metadata[''] = " . (new SpRemote())->starterText() . ';',
            'warnings' => [],
            'notices' => [],
        ]);
    }


    /**
     * "Already exists", on the line that names the entity, with the entity it clashes with.
     *
     * @return array<string, mixed>
     */
    public function exists(string $set, string $entityId, string $text): array
    {
        return [
            'pointer' => '',
            'message' => 'A service provider with this entity ID already exists.',
            'line' => self::identityLine($text),
            'column' => null,
            'existing' => [
                'entityId' => $entityId,
                'name' => $this->repositories->entities()->find($set, $entityId)?->name(),
            ],
        ];
    }


    /**
     * Errors without a line concern the entity ID: they go to the line that names it. Text that cannot be read
     * names none, and nothing else is checked until it can.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @return list<array{pointer: string, message: string, line: ?int, column: ?int}>
     */
    public static function errors(string $text, array $errors): array
    {
        $line = self::identityLine($text);
        if ($line === null) {
            return EntityJson::errors(
                array_values(array_filter($errors, static fn (ValidationError $e): bool => $e->line !== null)),
            );
        }

        return EntityJson::errors(array_map(
            static fn (ValidationError $e): ValidationError => $e->line === null ? $e->at($line) : $e,
            $errors,
        ));
    }


    private static function identityLine(string $text): ?int
    {
        $block = (new PhpReader())->read($text)->block;
        if ($block === null) {
            return null;
        }

        return $block->entityId === null ? $block->lines['entityid'] ?? $block->line : $block->line;
    }
}
