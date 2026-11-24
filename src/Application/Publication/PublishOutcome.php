<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

final readonly class PublishOutcome
{
    /**
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $problems
     */
    private function __construct(public ?int $number, public bool $moved, public array $problems)
    {
    }


    public static function published(int $number): self
    {
        return new self($number, false, []);
    }


    public static function moved(): self
    {
        return new self(null, true, []);
    }


    /**
     * @param list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem> $problems
     */
    public static function blocked(array $problems): self
    {
        return new self(null, false, $problems);
    }
}
