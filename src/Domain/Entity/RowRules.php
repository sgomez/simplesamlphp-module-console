<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * Cross-field rules of the options held as rows: a name or a priority is used once, and core:PHP is not a filter.
 */
final class RowRules
{
    private const array PHP_FILTER = ['core:php', 'simplesaml\\module\\core\\auth\\process\\php'];


    /**
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function check(array $document): array
    {
        $errors = [];
        foreach (['attributes', 'attributeencodings', 'EntityAttributes'] as $option) {
            array_push($errors, ...$this->unique((array) ($document[$option] ?? []), '/' . $option, 'name'));
        }
        foreach (array_values((array) ($document['contacts'] ?? [])) as $position => $contact) {
            $rows = (array) (((array) $contact)['attributes'] ?? []);
            array_push($errors, ...$this->unique($rows, '/contacts/' . $position . '/attributes', 'name'));
        }

        return [...$errors, ...$this->authproc((array) ($document['authproc'] ?? []))];
    }


    /**
     * @param array<array-key, mixed> $rows
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function unique(array $rows, string $path, string $field): array
    {
        $errors = [];
        $seen = [];
        foreach (array_values($rows) as $position => $row) {
            $value = ((array) $row)[$field] ?? null;
            if (!is_string($value) && !is_int($value)) {
                continue;
            }
            in_array($value, $seen, true)
                && $errors[] = new ValidationError("$path/$position/$field", "The $field '$value' is used twice.");
            $seen[] = $value;
        }

        return $errors;
    }


    /**
     * @param array<array-key, mixed> $rows
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function authproc(array $rows): array
    {
        $errors = $this->unique($rows, '/authproc', 'priority');
        foreach (array_values($rows) as $position => $row) {
            $class = ((array) (((array) $row)['filter'] ?? []))['class'] ?? null;
            if (is_string($class) && in_array(strtolower(ltrim($class, '\\')), self::PHP_FILTER, true)) {
                $errors[] = new ValidationError(
                    "/authproc/$position/filter/class",
                    'The core:PHP filter runs arbitrary code; keep the entity as an External entity.',
                );
            }
        }

        return $errors;
    }
}
