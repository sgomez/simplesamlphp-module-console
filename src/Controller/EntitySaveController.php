<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Application\SaveEntity;
use SimpleSAML\Module\console\Application\SaveOutcome;
use SimpleSAML\Module\console\Application\SaveResult;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;
use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\EntityEditView;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The create of the Twig add screen; edits go through the API.
 */
final class EntitySaveController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly AdminAccess $access,
        private readonly EntityEditView $view,
        private readonly Repositories $repositories,
        private readonly FlashMessage $flash,
    ) {
    }


    public function save(Request $request, string $set): Response
    {
        $stopped = $this->gate->guardPost($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $entityId = (string) $request->request->get('entityid', '');
        $text = (string) $request->request->get('php', '');
        $save = new SaveEntity($this->repositories->entities(), new SpRemote(new CoreCertificateFiles()));
        $result = $save->create($entityId, $text, $this->access->identity());

        return match ($result->outcome) {
            SaveOutcome::Saved => $this->saved($result),
            SaveOutcome::Invalid => $this->view->render($entityId, null, $text, $result->errors, 422),
            SaveOutcome::AlreadyExists, SaveOutcome::Conflict => $this->exists($entityId, $text),
        };
    }


    private function saved(SaveResult $result): Response
    {
        $messages = array_map(static fn ($notice): string => $notice->message, $result->notices);
        $this->flash->put(implode(' ', ['Saved.', ...$messages]));

        return new RedirectResponse($this->editUrl((string) $result->entityId));
    }


    private function exists(string $entityId, string $text): Response
    {
        return $this->view->render(
            $entityId,
            null,
            $text,
            [new ValidationError('', 'An entity with this entity ID already exists.')],
            422,
            ['existingUrl' => $this->editUrl($entityId)],
        );
    }


    private function editUrl(string $entityId): string
    {
        return Module::getModuleURL('console/entities/' . SpRemote::SET . '/edit', ['entityid' => $entityId]);
    }
}
