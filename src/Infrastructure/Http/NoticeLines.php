<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\Entity\Notice;
use SimpleSAML\Module\console\Domain\Php\PhpReader;

final class NoticeLines
{
    /**
     * The notices of a save, moved to the lines of the normalised text it answers; a notice whose option the text
     * no longer holds keeps no line.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     * @return list<\SimpleSAML\Module\console\Domain\Entity\Notice>
     */
    public static function relocated(string $text, array $notices): array
    {
        $lines = (new PhpReader())->read($text)->block->lines ?? [];

        return array_map(static fn (Notice $n): Notice => $n->at($lines[$n->option ?? ''] ?? null), $notices);
    }
}
