<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Application\Publication;

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Publication\PendingChanges;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Domain\Publication\SnapshotDocument;

/**
 * The confirmation screen and the confirming request of a Publication (section 8.4).
 */
final class Publication
{
    private readonly PublicationChecks $checks;


    public function __construct(
        private readonly PublicationStore $store,
        SpRemote $set,
        ProcessingFilterClasses $filters,
        private readonly EntityWarnings $warnings,
    ) {
        $this->checks = new PublicationChecks($set, $filters);
    }


    /**
     * The state of every enabled managed entity against the current Snapshot, and the Deleted ones.
     *
     * @return list<\SimpleSAML\Module\console\Domain\Publication\PendingChange>
     */
    public function states(): array
    {
        return $this->compute($this->store->read());
    }


    public function pendingCount(): int
    {
        return count(PendingChanges::pending($this->states()));
    }


    public function review(): PublicationReview
    {
        $input = $this->store->read();
        $all = $this->compute($input);
        $pending = PendingChanges::pending($all);
        $document = SnapshotDocument::build($input->entities);
        $entities = new PendingEntities($input);

        return new PublicationReview(
            $pending,
            $entities->names($pending),
            $this->checks->problems($input->entities, $document, $this->store->documentLimit()),
            $this->warningsOf($entities, $pending),
            PendingChanges::hash($all),
            $input->lastNumber + 1,
            $input->currentNumber,
            $input->currentCreatedAt,
        );
    }


    public function publish(string $hash, ?string $comment, string $identity): PublishOutcome
    {
        $comment = $comment === null ? '' : trim($comment);
        try {
            $number = $this->store->publish(
                fn (PublicationInput $input): string => $this->decide($input, $hash),
                $identity,
                $comment === '' ? null : $comment,
            );
        } catch (PublicationRefused $refused) {
            return $refused->isMoved() ? PublishOutcome::moved() : PublishOutcome::blocked($refused->problems);
        }

        return PublishOutcome::published($number);
    }


    private function decide(PublicationInput $input, string $hash): string
    {
        $changes = $this->compute($input);
        if (PendingChanges::pending($changes) === [] || PendingChanges::hash($changes) !== $hash) {
            throw PublicationRefused::moved();
        }
        $document = SnapshotDocument::build($input->entities);
        $problems = $this->checks->problems($input->entities, $document, $this->store->documentLimit());

        return $problems === [] ? $document : throw PublicationRefused::blocked($problems);
    }


    /**
     * @return list<\SimpleSAML\Module\console\Domain\Publication\PendingChange>
     */
    private function compute(PublicationInput $input): array
    {
        return PendingChanges::compute($input->entities, SnapshotContent::parse($input->currentDocument));
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Publication\PendingChange> $pending
     * @return list<\SimpleSAML\Module\console\Application\Publication\PublicationProblem>
     */
    private function warningsOf(PendingEntities $entities, array $pending): array
    {
        $warnings = [];
        foreach ($pending as $change) {
            $entity = $entities->saved($change);
            if ($entity === null || $entity->document === null) {
                continue;
            }
            foreach ($this->warnings->of($change->set, $change->entityId, $entity->document) as $text) {
                $warnings[] = new PublicationProblem($change->entityId, $text, $entity->name());
            }
        }

        return $warnings;
    }
}
