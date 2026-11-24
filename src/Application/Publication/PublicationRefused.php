<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

/**
 * A Publication that was not made: the screen is shown again with the current state. Either the Pending changes
 * moved or the Publication lost a race (section 4.8), or problems block it.
 */
final class PublicationRefused extends \RuntimeException
{
    /**
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $problems
     */
    private function __construct(string $message, public readonly array $problems, ?\Throwable $previous = null)
    {
        parent::__construct($message, 0, $previous);
    }


    public static function moved(?\Throwable $previous = null): self
    {
        return new self('The Pending changes moved or the Publication lost a race.', [], $previous);
    }


    /**
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $problems
     */
    public static function blocked(array $problems): self
    {
        return new self('The Publication is blocked.', $problems);
    }


    public function isMoved(): bool
    {
        return $this->problems === [];
    }
}
