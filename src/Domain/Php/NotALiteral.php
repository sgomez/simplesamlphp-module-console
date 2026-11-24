<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

use PhpParser\Node;

final class NotALiteral extends \RuntimeException
{
    public function __construct(string $message, public readonly Node $node)
    {
        parent::__construct($message);
    }
}
