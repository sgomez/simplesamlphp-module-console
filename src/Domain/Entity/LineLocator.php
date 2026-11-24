<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

use SimpleSAML\Module\console\Domain\Php\PhpBlock;

/**
 * Ties what was found in a document back to the line of the root option of the text it came from.
 */
final class LineLocator
{
    public function __construct(
        private readonly InverseResult $converted,
        private readonly PhpBlock $block,
    ) {
    }


    /**
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function unavailable(): array
    {
        return array_map(
            fn (string $option): ValidationError => new ValidationError(
                '/' . $option,
                "The option '$option' is not available yet.",
                $this->block->lines[$option] ?? $this->block->line,
            ),
            $this->converted->unavailable,
        );
    }


    public function error(ValidationError $error): ValidationError
    {
        if ($error->line !== null) {
            return $error;
        }
        $segments = array_map(
            static fn (string $s): string => str_replace(['~1', '~0'], ['/', '~'], $s),
            explode('/', ltrim($error->pointer, '/')),
        );
        $option = $segments[0] === 'extra' && isset($segments[1]) ? $segments[1] : $segments[0];
        $source = $this->converted->sources[$option] ?? $option;

        return $error->at($this->block->lines[$source] ?? $this->block->lines[$option] ?? $this->block->line);
    }


    public function notice(Notice $notice): Notice
    {
        return $notice->line === null
            ? $notice->at($this->block->lines[$notice->option ?? ''] ?? $this->block->line)
            : $notice;
    }
}
