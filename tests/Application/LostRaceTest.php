<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\EntityAlreadyExists;
use SimpleSAML\Module\console\Application\EntityRepository;
use SimpleSAML\Module\console\Application\SaveEntity;
use SimpleSAML\Module\console\Application\SaveOutcome;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Tests\Support\SpText;

it('answers "already exists" when the entity appears between the check and the insert', function (): void {
    $repository = new class implements EntityRepository {
        public function find(string $set, string $entityId): ?StoredEntity
        {
            return null;
        }


        public function all(string $set): array
        {
            return [];
        }


        public function create(string $set, string $entityId, array $document, string $identity): void
        {
            throw new EntityAlreadyExists('lost the race');
        }


        public function update(string $set, string $entityId, int $version, array $document, string $id): int
        {
            throw new LogicException('not used');
        }


        public function delete(string $set, string $entityId, string $identity): void
        {
            throw new LogicException('not used');
        }
    };

    $save = new SaveEntity($repository, new SpRemote());
    $result = $save->create('https://a.example.org', '[' . SpText::ACS . ']', 'a');

    expect($result->outcome)->toBe(SaveOutcome::AlreadyExists)
        ->and($result->entityId)->toBe('https://a.example.org');
});
