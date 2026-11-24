<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

use PhpParser\Node;
use PhpParser\Node\Expr\Array_;
use PhpParser\Node\Expr\ArrayItem;
use PhpParser\Node\Expr\ClassConstFetch;
use PhpParser\Node\Expr\ConstFetch;
use PhpParser\Node\Expr\UnaryMinus;
use PhpParser\Node\Scalar\Float_;
use PhpParser\Node\Scalar\Int_;
use PhpParser\Node\Scalar\String_;

final class LiteralWalker
{
    private const string MESSAGE = 'Only literal values are allowed';


    public function value(Node $node): mixed
    {
        return match (true) {
            $node instanceof Array_ => $this->array($node),
            $node instanceof String_, $node instanceof Int_, $node instanceof Float_ => $node->value,
            $node instanceof UnaryMinus => $this->negative($node),
            $node instanceof ConstFetch => $this->constant($node),
            $node instanceof ClassConstFetch => $this->classConstant($node),
            default => throw new NotALiteral(self::MESSAGE, $node),
        };
    }


    /**
     * @return array<array-key, mixed>
     */
    public function array(Array_ $array): array
    {
        $result = [];
        $next = 0;
        foreach ($array->items as $item) {
            $key = $this->key($item, $next);
            $result[$key] = $this->value($item->value);
            $next = is_int($key) ? max($next, $key + 1) : $next;
        }

        return $result;
    }


    public function key(ArrayItem $item, int $next): int|string
    {
        if ($item->unpack || $item->byRef) {
            throw new NotALiteral(self::MESSAGE, $item);
        }
        if ($item->key === null) {
            return $next;
        }
        $key = $this->value($item->key);
        if (!is_string($key) && !is_int($key)) {
            throw new NotALiteral('A key must be a string or an integer literal', $item->key);
        }

        return is_string($key) && preg_match('/^(0|-?[1-9][0-9]{0,17})$/', $key) === 1 ? (int) $key : $key;
    }


    private function negative(UnaryMinus $node): int|float
    {
        $inner = $node->expr;
        if ($inner instanceof Int_ || $inner instanceof Float_) {
            return -$inner->value;
        }

        throw new NotALiteral(self::MESSAGE, $node);
    }


    private function constant(ConstFetch $node): bool|null
    {
        return match (strtolower($node->name->toString())) {
            'true' => true,
            'false' => false,
            'null' => null,
            default => throw new NotALiteral(self::MESSAGE, $node),
        };
    }


    private function classConstant(ClassConstFetch $node): string
    {
        $class = $node->class;
        $name = $node->name;
        $value = $class instanceof Node\Name && $class->toString() === Saml2Constants::CLASS_NAME
            && $name instanceof Node\Identifier ? Saml2Constants::value($name->toString()) : null;

        return $value ?? throw new NotALiteral(self::MESSAGE, $node);
    }
}
