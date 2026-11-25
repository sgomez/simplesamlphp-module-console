<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Application\Publication\PublicationProblem;
use SimpleSAML\Module\console\Application\Publication\PublicationReview;
use SimpleSAML\Module\console\Domain\Publication\EntityState;
use SimpleSAML\Module\console\Domain\Publication\PendingChange;
use SimpleSAML\Module\console\Infrastructure\Build\NodeBuild;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class PublicationController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly AdminAccess $access,
        private readonly Repositories $repositories,
        private readonly NodeBuild $build,
    ) {
    }


    public function show(Request $request): JsonResponse
    {
        return $this->gate->guard($request) ?? new JsonResponse($this->review());
    }


    public function publish(Request $request): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $body = json_decode((string) $request->getContent(), true);
        $body = is_array($body) ? $body : [];
        $outcome = $this->repositories->publication()->publish(
            is_string($body['hash'] ?? null) ? $body['hash'] : '',
            is_string($body['comment'] ?? null) ? $body['comment'] : null,
            $this->access->identity(),
        );
        if ($outcome->number !== null) {
            $build = trim($this->build->after($outcome->number));

            return new JsonResponse(['number' => $outcome->number, 'build' => $build === '' ? null : $build]);
        }

        // A new problem found here is a move of the review too (SPEC 10.14): both answer 409 with the current state.
        return new JsonResponse($outcome->moved
            ? ['code' => 'moved', 'review' => $this->review()]
            : [
                'code' => 'blocked',
                'problems' => array_map($this->problem(...), $outcome->problems),
                'review' => $this->review(),
            ], 409);
    }


    /**
     * @return array<string, mixed>
     */
    private function review(): array
    {
        $review = $this->repositories->publication()->review();

        return [
            'groups' => $this->groups($review),
            'problems' => array_map($this->problem(...), $review->problems),
            'warnings' => array_map($this->problem(...), $review->warnings),
            'hash' => $review->hash,
            'nextNumber' => $review->nextNumber,
            'current' => $review->currentNumber === null
                ? null
                : ['number' => $review->currentNumber, 'createdAt' => $review->currentCreatedAt],
            'canPublish' => $review->canPublish(),
        ];
    }


    /**
     * @return list<array{state: string, changes: list<array<string, mixed>>}>
     */
    private function groups(PublicationReview $review): array
    {
        $groups = [];
        foreach (EntityState::cases() as $state) {
            $changes = array_values(array_filter(
                $review->changes,
                static fn (PendingChange $change): bool => $change->state === $state,
            ));
            $changes === [] || $groups[] = [
                'state' => $state->value,
                'changes' => array_map($this->change(...), $changes),
            ];
        }

        return $groups;
    }


    /**
     * @return array{entityId: string, loadError: ?string, opens: bool}
     */
    private function change(PendingChange $change): array
    {
        return [
            'entityId' => $change->entityId,
            'loadError' => $change->loadError,
            'opens' => $change->state !== EntityState::Unreadable && $change->state !== EntityState::Deleted,
        ];
    }


    /**
     * @return array{entityId: ?string, message: string}
     */
    private function problem(PublicationProblem $problem): array
    {
        return ['entityId' => $problem->entityId, 'message' => $problem->message];
    }
}
