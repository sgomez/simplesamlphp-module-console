<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityJson;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class EntityController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly EntityJson $json,
    ) {
    }


    public function show(Request $request, string $set): JsonResponse
    {
        return $this->gate->guard($request)
            ?? $this->json->current($set, (string) $request->query->get('entityid', ''));
    }
}
