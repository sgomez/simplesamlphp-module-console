<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Entity;

final class EntityIdRules
{
    /**
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    public function check(string $entityId): array
    {
        if ($entityId === '') {
            return [new ValidationError('', 'The entity ID is required.')];
        }
        if (strlen($entityId) > 1024) {
            return [new ValidationError('', 'The entity ID is at most 1024 bytes long.')];
        }

        return [];
    }
}
