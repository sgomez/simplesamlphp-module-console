<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

use SimpleSAML\Module\console\Domain\Php\PhpBlock;

final class BlockHeader
{
    /**
     * The entity ID the block stands for, its options without what core adds or the Console does not keep,
     * and what was found wrong or dropped on the way.
     */
    public function read(PhpBlock $block, ?string $expected): HeaderReading
    {
        $errors = [];
        $entityId = $expected ?? $block->entityId;
        $inside = $block->options['entityid'] ?? null;
        $insideLine = $block->lines['entityid'] ?? $block->line;
        foreach ([[$block->entityId, $block->line], [$inside, $insideLine]] as [$found, $line]) {
            if (is_string($found) && $entityId !== null && $found !== $entityId) {
                $errors[] = new ValidationError('', "The entity ID in the text ('$found') is not the entity's.", $line);
            }
            $entityId ??= is_string($found) ? $found : null;
        }

        return new HeaderReading(
            $entityId,
            array_diff_key(
                $block->options,
                array_flip(['entityid', 'metadata-set', 'metadata-index', 'url', 'expire']),
            ),
            $errors,
            isset($block->options['expire'])
                ? [new Notice('expire was dropped: the Console does not keep it.', 'expire', $block->lines['expire'])]
                : [],
        );
    }
}
