<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Application\Publication\PublicationProblem;
use SimpleSAML\Module\console\Application\Publication\PublicationReview;
use SimpleSAML\Module\console\Domain\Publication\EntityState;
use SimpleSAML\Module\console\Domain\Publication\PendingChange;
use SimpleSAML\Module\console\Infrastructure\Build\NodeBuild;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\PageFactory;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class PublishController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly AdminAccess $access,
        private readonly PageFactory $pages,
        private readonly FlashMessage $flash,
        private readonly Repositories $repositories,
        private readonly NodeBuild $build,
    ) {
    }


    public function review(): Response
    {
        return $this->gate->guardGet() ?? $this->screen();
    }


    public function publish(Request $request): Response
    {
        $stopped = $this->gate->guardPost($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $hash = $request->request->get('hash');
        $comment = $request->request->get('comment');
        $outcome = $this->repositories->publication()->publish(
            is_string($hash) ? $hash : '',
            is_string($comment) ? $comment : null,
            $this->access->identity(),
        );
        if ($outcome->number !== null) {
            $this->flash->put('Snapshot ' . $outcome->number . ' published.' . $this->build->after($outcome->number));

            return new RedirectResponse(Module::getModuleURL('console/publish'));
        }

        return $this->screen($outcome->moved
            ? 'The Pending changes changed since you opened this screen. Review them again.'
            : 'The Publication is blocked. Fix the problems below.');
    }


    private function screen(?string $message = null): Response
    {
        $review = $this->repositories->publication()->review();

        return $this->pages->make('publish.twig', [
            'groups' => $this->groups($review),
            'problems' => array_map($this->problem(...), $review->problems),
            'warnings' => array_map($this->problem(...), $review->warnings),
            'hash' => $review->hash,
            'nextNumber' => $review->nextNumber,
            'currentNumber' => $review->currentNumber,
            'currentCreatedAt' => $review->currentCreatedAt,
            'canPublish' => $review->canPublish(),
            'publishUrl' => Module::getModuleURL('console/publish'),
        ] + ($message === null ? [] : ['message' => $message]));
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
     * @return array<string, mixed>
     */
    private function change(PendingChange $change): array
    {
        return [
            'set' => $change->set,
            'entityId' => $change->entityId,
            'loadError' => $change->loadError,
            'url' => $change->state === EntityState::Unreadable || $change->state === EntityState::Deleted
                ? null
                : Module::getModuleURL('console/entities/' . $change->set . '/edit', ['entityid' => $change->entityId]),
        ];
    }


    /**
     * @return array{entityId: ?string, message: string, url: ?string}
     */
    private function problem(PublicationProblem $problem): array
    {
        return [
            'entityId' => $problem->entityId,
            'message' => $problem->message,
            'url' => $problem->entityId === null ? null : Module::getModuleURL(
                'console/entities/saml20-sp-remote/edit',
                ['entityid' => $problem->entityId],
            ),
        ];
    }
}
