<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Application\SaveEntity;
use SimpleSAML\Module\console\Application\SaveOutcome;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Infrastructure\Http\AdminAccess;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityJson;
use SimpleSAML\Module\console\Infrastructure\Http\NewEntityJson;
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
        private readonly NewEntityJson $new,
    ) {
    }


    /**
     * An edit sends the version it was loaded with; a create sends none and takes its entity ID from the text.
     */
    public function save(Request $request, string $set): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $body = EntityJson::input($request);
        $text = is_string($body['php'] ?? null) ? $body['php'] : '';
        if (!array_key_exists('version', $body)) {
            return $this->create($set, $text);
        }
        $entityId = is_string($body['entityid'] ?? null) ? $body['entityid'] : '';
        $version = is_int($body['version']) ? $body['version'] : 0;
        $result = $this->saver()->edit($entityId, $version, $text, $this->access->identity());

        return match ($result->outcome) {
            SaveOutcome::Saved => $this->json->current($set, $entityId, notices: $result->notices),
            SaveOutcome::Invalid => EntityJson::refused($text, EntityJson::errors($result->errors), $result->notices),
            SaveOutcome::Conflict, SaveOutcome::AlreadyExists => $this->json->current($set, $entityId, 409),
        };
    }


    private function create(string $set, string $text): JsonResponse
    {
        $result = $this->saver()->create('', $text, $this->access->identity());
        $entityId = (string) $result->entityId;
        $errors = NewEntityJson::errors($text, $result->errors);

        return match ($result->outcome) {
            SaveOutcome::Saved => $this->json->current($set, $entityId, notices: $result->notices),
            SaveOutcome::Invalid => EntityJson::refused($text, $errors, $result->notices),
            SaveOutcome::AlreadyExists, SaveOutcome::Conflict
                => EntityJson::refused($text, [$this->new->exists($set, $entityId, $text)], []),
        };
    }


    private function saver(): SaveEntity
    {
        return new SaveEntity($this->repositories->entities(), new SpRemote(new CoreCertificateFiles()));
    }
}
