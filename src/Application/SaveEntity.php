<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application;

use SimpleSAML\Module\console\Domain\Entity\EntityIdRules;
use SimpleSAML\Module\console\Domain\Entity\ParsedEntity;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;

final class SaveEntity
{
    public function __construct(
        private readonly EntityRepository $repository,
        private readonly SpRemote $set,
    ) {
    }


    /**
     * @param string $enteredId the identity field; empty takes the entity ID from the block
     */
    public function create(string $enteredId, string $text, string $identity): SaveResult
    {
        $parsed = $this->set->fromText($text, $enteredId === '' ? null : $enteredId);
        $entityId = (string) $parsed->entityId;
        $problems = [...$parsed->errors, ...(new EntityIdRules())->check($entityId)];
        if ($problems !== [] || $parsed->document === null) {
            return SaveResult::invalid($problems, $parsed->notices);
        }
        if ($this->repository->find(SpRemote::SET, $entityId) !== null) {
            return SaveResult::alreadyExists($entityId);
        }
        try {
            $this->repository->create(SpRemote::SET, $entityId, $parsed->document, $identity);
        } catch (EntityAlreadyExists) {
            return SaveResult::alreadyExists($entityId);
        }

        return $this->saved($entityId, 1, $parsed);
    }


    public function edit(string $entityId, int $version, string $text, string $identity): SaveResult
    {
        $parsed = $this->set->fromText($text, $entityId);
        if (!$parsed->isValid() || $parsed->document === null) {
            return SaveResult::invalid($parsed->errors, $parsed->notices);
        }
        try {
            $newVersion = $this->repository->update(SpRemote::SET, $entityId, $version, $parsed->document, $identity);
        } catch (EntityConflict) {
            return SaveResult::conflict();
        }

        return $this->saved($entityId, $newVersion, $parsed);
    }


    private function saved(string $entityId, int $version, ParsedEntity $parsed): SaveResult
    {
        $text = $this->set->toText($entityId, $parsed->document ?? []);

        return SaveResult::saved($entityId, $version, $text, $parsed->notices);
    }
}
