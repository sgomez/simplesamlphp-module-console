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

final class EntitySaveController
{
    private const string CHANGED = 'This service provider changed meanwhile. Your edits were not saved; '
        . 'this is how it stands now.';

    private const string NORMALISED = 'The text was rewritten in schema order and its comments were dropped.';


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
        $version = $request->request->has('version') ? $request->request->getInt('version') : null;
        $save = new SaveEntity($this->repositories->entities(), new SpRemote(new CoreCertificateFiles()));
        $identity = $this->access->identity();
        $result = $version === null
            ? $save->create($entityId, $text, $identity)
            : $save->edit($entityId, $version, $text, $identity);

        return match ($result->outcome) {
            SaveOutcome::Saved => $this->saved($result),
            SaveOutcome::Invalid => $this->view->render($entityId, $version, $text, $result->errors, 422),
            SaveOutcome::AlreadyExists => $this->exists($entityId, $text),
            SaveOutcome::Conflict => $this->conflict($set, $entityId),
        };
    }


    private function saved(SaveResult $result): Response
    {
        $messages = array_map(static fn ($notice): string => $notice->message, $result->notices);
        $this->flash->put(implode(' ', ['Saved.', ...$messages]));
        $result->normalised && $this->flash->putNotice(self::NORMALISED);

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


    private function conflict(string $set, string $entityId): Response
    {
        $entity = $this->repositories->entities()->find($set, $entityId);
        if ($entity === null || $entity->document === null) {
            $this->flash->put('The service provider no longer exists.');

            return new RedirectResponse(Module::getModuleURL('console/entities/' . $set));
        }

        return $this->view->render(
            $entityId,
            $entity->version,
            (new SpRemote())->toText($entityId, $entity->document),
            [],
            409,
            ['message' => self::CHANGED],
        );
    }


    private function editUrl(string $entityId): string
    {
        return Module::getModuleURL('console/entities/' . SpRemote::SET . '/edit', ['entityid' => $entityId]);
    }
}
