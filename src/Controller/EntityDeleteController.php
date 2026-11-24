<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\FlashMessage;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class EntityDeleteController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly AdminAccess $access,
        private readonly Repositories $repositories,
        private readonly FlashMessage $flash,
    ) {
    }


    public function delete(Request $request, string $set): Response
    {
        $stopped = $this->gate->guardPost($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $entityId = (string) $request->request->get('entityid', '');
        $this->repositories->entities()->delete($set, $entityId, $this->access->identity());
        $this->flash->put('Deleted.');

        return new RedirectResponse(Module::getModuleURL('console/entities/' . $set));
    }
}
