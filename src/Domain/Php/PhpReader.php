<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

use PhpParser\Error;
use PhpParser\Node;
use PhpParser\Node\Expr\Array_;
use PhpParser\Node\Expr\ArrayDimFetch;
use PhpParser\Node\Expr\Assign;
use PhpParser\Node\Expr\Variable;
use PhpParser\Node\Scalar\String_;
use PhpParser\Node\Stmt\Expression;
use PhpParser\Node\Stmt\Nop;
use PhpParser\ParserFactory;

final class PhpReader
{
    private const string TAG = '<?php ';


    private readonly LiteralWalker $walker;


    public function __construct()
    {
        $this->walker = new LiteralWalker();
    }


    public function read(string $text): PhpReading
    {
        $tagged = str_starts_with($text, '<?php');
        $source = ($tagged ? '' : self::TAG) . $text . "\n;";
        $tag = $tagged ? 0 : strlen(self::TAG);

        try {
            $statements = (new ParserFactory())->createForNewestSupportedVersion()->parse($source) ?? [];

            return new PhpReading($this->block($statements));
        } catch (Error $e) {
            $position = $e->getAttributes()['startFilePos'] ?? -1;
            $position = is_int($position) ? $position : -1;

            return $this->failure($e->getRawMessage(), $e->getStartLine(), $position, $source, $tag);
        } catch (NotALiteral $e) {
            $node = $e->node;

            return $this->failure($e->getMessage(), $node->getStartLine(), $node->getStartFilePos(), $source, $tag);
        }
    }


    /**
     * @param array<\PhpParser\Node\Stmt> $statements
     */
    private function block(array $statements): PhpBlock
    {
        $statements = array_values(array_filter($statements, static fn (Node $s): bool => !$s instanceof Nop));
        if (count($statements) !== 1) {
            $message = 'Expected one block, an array literal or a $metadata[...] statement';

            throw new NotALiteral($message, $statements[1] ?? new Nop());
        }
        $statement = $statements[0];
        $expression = $statement instanceof Expression ? $statement->expr : null;
        if ($expression instanceof Array_) {
            return $this->options(null, $expression);
        }
        if ($expression instanceof Assign) {
            return $this->wrapper($expression);
        }

        throw new NotALiteral('Expected an array literal or a $metadata[...] statement', $statement);
    }


    private function wrapper(Assign $assign): PhpBlock
    {
        $target = $assign->var;
        if (
            !$target instanceof ArrayDimFetch
            || !$target->var instanceof Variable
            || $target->var->name !== 'metadata'
            || !$target->dim instanceof String_
            || !$assign->expr instanceof Array_
        ) {
            $message = 'Expected $metadata[\'<entity ID>\'] = [...] with a literal entity ID and array';

            throw new NotALiteral($message, $assign);
        }

        return $this->options($target->dim->value, $assign->expr);
    }


    private function options(?string $entityId, Array_ $array): PhpBlock
    {
        $options = [];
        $lines = [];
        $next = 0;
        foreach ($array->items as $item) {
            $key = $this->walker->key($item, $next);
            $options[$key] = $this->walker->value($item->value);
            $next = is_int($key) ? max($next, $key + 1) : $next;
            $lines[(string) $key] = ($item->key ?? $item)->getStartLine();
        }

        return new PhpBlock($entityId, $options, $lines, $array->getStartLine());
    }


    private function failure(string $message, int $line, int $position, string $source, int $tag): PhpReading
    {
        $line = max($line, 1);
        $before = $position >= 0 ? substr($source, 0, $position) : '';
        $column = $position >= 0 ? $position - (int) strrpos("\n" . $before, "\n") + 1 : 1;
        $column = $line === 1 ? $column - $tag : $column;

        return new PhpReading(null, new ReadError($message, $line, max($column, 1)));
    }
}
