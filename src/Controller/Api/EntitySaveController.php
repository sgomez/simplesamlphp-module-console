<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Application\SaveEntity;
use SimpleSAML\Module\console\Application\SaveOutcome;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Php\PhpReader;
use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityJson;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class EntitySaveController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly AdminAccess $access,
        private readonly Repositories $repositories,
        private readonly EntityJson $json,
    ) {
    }


    public function save(Request $request, string $set): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $body = EntityJson::input($request);
        $entityId = is_string($body['entityid'] ?? null) ? $body['entityid'] : '';
        $text = is_string($body['php'] ?? null) ? $body['php'] : '';
        $version = is_int($body['version'] ?? null) ? $body['version'] : 0;
        $save = new SaveEntity($this->repositories->entities(), new SpRemote(new CoreCertificateFiles()));
        $result = $save->edit($entityId, $version, $text, $this->access->identity());

        return match ($result->outcome) {
            SaveOutcome::Saved => $this->json->current($set, $entityId, notices: $result->notices),
            SaveOutcome::Invalid => EntityJson::respond([
                'errors' => EntityJson::errors($result->errors),
                'notices' => EntityJson::notices($result->notices),
                'readable' => (new PhpReader())->read($text)->error === null,
            ], 422),
            SaveOutcome::Conflict, SaveOutcome::AlreadyExists => $this->json->current($set, $entityId, 409),
        };
    }
}
