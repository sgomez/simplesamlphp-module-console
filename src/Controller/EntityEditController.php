<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Http\EntityEditView;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\PageFactory;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class EntityEditController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly PageFactory $pages,
        private readonly EntityEditView $view,
        private readonly Repositories $repositories,
        private readonly FlashMessage $flash,
    ) {
    }


    public function add(string $set): Response
    {
        return $this->gate->guardGet() ?? $this->view->render('', null, (new SpRemote())->starterText());
    }


    public function edit(Request $request, string $set): Response
    {
        $stopped = $this->gate->guardGet();
        if ($stopped !== null) {
            return $stopped;
        }
        $entityId = (string) $request->query->get('entityid', '');
        $entity = $this->repositories->entities()->find($set, $entityId);
        if ($entity === null) {
            return $this->pages->notFound();
        }
        if ($entity->document === null) {
            $this->flash->put('The service provider cannot be opened: ' . $entity->loadError);

            return new RedirectResponse(Module::getModuleURL('console/entities/' . $set));
        }

        return $this->view->render(
            $entityId,
            $entity->version,
            (new SpRemote())->toText($entityId, $entity->document),
            extra: ['name' => $entity->name()],
        );
    }
}
