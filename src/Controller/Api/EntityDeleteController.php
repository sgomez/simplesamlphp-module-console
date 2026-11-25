<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityJson;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class EntityDeleteController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly AdminAccess $access,
        private readonly Repositories $repositories,
    ) {
    }


    /**
     * Deletes the named entity, Unreadable or not; an entity already gone answers the same and writes nothing.
     */
    public function delete(Request $request, string $set): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $body = EntityJson::input($request);
        $entityId = is_string($body['entityid'] ?? null) ? $body['entityid'] : '';
        $this->repositories->entities()->delete($set, $entityId, $this->access->identity());

        return EntityJson::respond(['entityid' => $entityId]);
    }
}
