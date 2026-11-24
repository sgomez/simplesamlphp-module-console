<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Tests\Support;

use SimpleSAML\Module\console\Application\Publication\ProcessingFilterClasses;
use SimpleSAML\Module\console\Application\Publication\PublicationChecks;
use SimpleSAML\Module\console\Application\Publication\PublicationProblem;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;

final class PublicationChecking
{
    public static function checksResolving(string ...$known): PublicationChecks
    {
        $filters = new class ($known) implements ProcessingFilterClasses {
            /** @param list<string> $known */
            public function __construct(private readonly array $known)
            {
            }


            public function resolves(string $class): bool
            {
                return in_array($class, $this->known, true);
            }
        };

        return new PublicationChecks(new SpRemote(), $filters);
    }


    public static function problemsOf(array $problems): array
    {
        return array_map(static fn (PublicationProblem $p): array => [$p->entityId, $p->message], $problems);
    }
}
