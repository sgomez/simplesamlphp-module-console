<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Build;

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Php\PhpExporter;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;

/**
 * The entities of one set translated into what core expects, and the ones this node leaves out.
 */
final class ServedSet
{
    /**
     * @param array<string, array<array-key, mixed>> $entities by entity ID
     * @param list<array{set: string, entityid: string, reason: string}> $leftOut
     */
    private function __construct(public readonly array $entities, public readonly array $leftOut)
    {
    }


    public static function translate(SnapshotContent $content, string $set): self
    {
        $served = [];
        $leftOut = [];
        foreach ($content->entityIds($set) as $entityId) {
            try {
                $served[$entityId] = self::core($set, self::named($content->document($set, $entityId) ?? []));
            } catch (\Throwable $e) {
                $leftOut[] = ['set' => $set, 'entityid' => $entityId, 'reason' => $e->getMessage()];
            }
        }

        return new self($served, $leftOut);
    }


    public function php(): string
    {
        return "<?php\n\nreturn " . PhpExporter::value($this->entities) . ";\n";
    }


    /**
     * @param array<array-key, mixed> $document
     * @return array<string, mixed>
     */
    private static function named(array $document): array
    {
        return array_filter($document, is_string(...), ARRAY_FILTER_USE_KEY);
    }


    /**
     * @param array<string, mixed> $document
     * @return array<array-key, mixed>
     */
    private static function core(string $set, array $document): array
    {
        if ($set !== SpRemote::SET) {
            throw new \LogicException('This version of the Console does not serve ' . $set);
        }
        $sp = new SpRemote();
        $errors = $sp->check($document);
        if ($errors !== []) {
            throw new \DomainException($errors[0]->pointer . ': ' . $errors[0]->message);
        }

        return $sp->toCore($document);
    }
}
