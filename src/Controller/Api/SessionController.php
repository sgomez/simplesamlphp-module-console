<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class SessionController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly AdminAccess $access,
        private readonly Repositories $repositories,
    ) {
    }


    public function show(Request $request): JsonResponse
    {
        return $this->gate->guard($request) ?? new JsonResponse([
            ...$this->access->links(),
            'pendingCount' => $this->repositories->publication()->pendingCount(),
            'current' => $this->repositories->currentSnapshot(),
            'counts' => ['saml20-sp-remote' => count($this->repositories->entities()->all('saml20-sp-remote'))],
        ]);
    }
}
