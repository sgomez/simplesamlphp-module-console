<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\Entity\ValidationError;

final class StoredErrors
{
    /**
     * The re-read errors plus those of the stored document that the re-read missed, without a line.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $stored
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public static function merge(array $errors, array $stored): array
    {
        $seen = array_map(static fn (ValidationError $e): string => $e->pointer . "\0" . $e->message, $errors);
        foreach ($stored as $error) {
            if (!in_array($error->pointer . "\0" . $error->message, $seen, true)) {
                $errors[] = new ValidationError($error->pointer, $error->message);
            }
        }

        return $errors;
    }
}
