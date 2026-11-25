<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Domain\Entity\EntityIdRules;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityJson;
use SimpleSAML\Module\console\Infrastructure\Http\EntityWarnings;
use SimpleSAML\Module\console\Infrastructure\Http\NewEntityJson;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class EntityValidateController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly EntityWarnings $warnings,
        private readonly NewEntityJson $new,
        private readonly Repositories $repositories,
    ) {
    }


    /**
     * The checks of a save, saving nothing: an edit names its entity ID, a new entity takes it from the text.
     */
    public function validate(Request $request, string $set): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $body = EntityJson::input($request);
        $text = is_string($body['php'] ?? null) ? $body['php'] : '';
        $expected = is_string($body['entityid'] ?? null) && $body['entityid'] !== '' ? $body['entityid'] : null;
        $parsed = (new SpRemote(new CoreCertificateFiles()))->fromText($text, $expected);
        $entityId = (string) $parsed->entityId;
        $errors = EntityJson::errors($parsed->errors);
        if ($expected === null && $parsed->document !== null) {
            $errors = $this->created($set, $entityId, $text, $parsed->errors);
        }

        return EntityJson::respond([
            'errors' => $errors,
            'notices' => EntityJson::notices($parsed->notices),
            'warnings' => $parsed->document === null ? [] : $this->warnings->of($entityId, $parsed->document),
            'readable' => $parsed->document !== null,
        ]);
    }


    /**
     * The errors of a create: those of the text, then the entity ID's, and, when there are none, a clash.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @return list<array<string, mixed>>
     */
    private function created(string $set, string $entityId, string $text, array $errors): array
    {
        $errors = [...$errors, ...(new EntityIdRules())->check($entityId)];
        if ($errors === [] && $this->repositories->entities()->find($set, $entityId) !== null) {
            return [$this->new->exists($set, $entityId, $text)];
        }

        return NewEntityJson::errors($text, $errors);
    }
}
