<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

/**
 * What Milestone 1 cannot handle yet: Secret references, the key slot and the shared key.
 */
final class NotYetRules
{
    private const string SECRET_REFERENCE = '/^%secret\([^)]*\)%$/';

    private const array OPTIONS = ['signature_key', 'sharedkey'];


    /**
     * @param array<string, mixed> $document
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function check(array $document): array
    {
        $errors = [];
        foreach ($document as $option => $value) {
            if (in_array($option, self::OPTIONS, true)) {
                $errors[] = new ValidationError('/' . $option, "The option '$option' is not available yet.");
            } elseif ($option !== 'extra') {
                array_push($errors, ...$this->references($value, '/' . self::escape($option)));
            }
        }

        return $errors;
    }


    /**
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function references(mixed $value, string $path): array
    {
        if (is_string($value)) {
            return preg_match(self::SECRET_REFERENCE, $value) === 1
                ? [new ValidationError($path, 'Secret references are not available yet.')]
                : [];
        }
        $errors = [];
        foreach (is_array($value) ? $value : [] as $key => $item) {
            array_push($errors, ...$this->references($item, $path . '/' . self::escape((string) $key)));
        }

        return $errors;
    }


    private static function escape(string $key): string
    {
        return str_replace(['~', '/'], ['~0', '~1'], $key);
    }
}
