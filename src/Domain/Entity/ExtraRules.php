<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class ExtraRules
{
    private const string SECRET_REFERENCE = '/^%secret\([^)]*\)%$/';


    /**
     * @param list<string> $cataloged the options of the set
     */
    public function __construct(private readonly array $cataloged)
    {
    }


    /**
     * @param array<array-key, mixed> $extra
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function check(array $extra): array
    {
        $errors = [];
        foreach ($extra as $key => $value) {
            $path = '/extra/' . self::escape((string) $key);
            if ($this->reserved((string) $key)) {
                $errors[] = new ValidationError($path, "The option '$key' is cataloged or emitted by the translator.");
            }
            array_push($errors, ...$this->references($value, $path));
        }

        return $errors;
    }


    private function reserved(string $key): bool
    {
        $emitted = [
            'keys', 'certData', 'certificate', 'key_name', 'privatekey', 'privatekey_pass', 'expire', 'entityid',
            'metadata-set', 'metadata-index',
        ];
        if (in_array($key, [...$this->cataloged, ...$emitted], true)) {
            return true;
        }
        foreach (['new_', 'signature.', 'metadata.sign.', 'https.'] as $prefix) {
            if (str_starts_with($key, $prefix)) {
                return true;
            }
        }

        return false;
    }


    /**
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function references(mixed $value, string $path): array
    {
        if (is_string($value)) {
            return preg_match(self::SECRET_REFERENCE, $value) === 1
                ? [new ValidationError($path, 'A Secret reference is not accepted in extra.')]
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
