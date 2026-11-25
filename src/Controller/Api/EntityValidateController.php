<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Domain\Entity\EntityIdRules;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Core\CoreCertificateFiles;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityJson;
use SimpleSAML\Module\console\Infrastructure\Http\EntityWarnings;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class EntityValidateController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly EntityWarnings $warnings,
    ) {
    }


    /**
     * The checks of a save, saving nothing: an edit names its entity ID, a new entity takes it from the text.
     */
    public function validate(Request $request): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $body = EntityJson::input($request);
        $expected = is_string($body['entityid'] ?? null) && $body['entityid'] !== '' ? $body['entityid'] : null;
        $parsed = (new SpRemote(new CoreCertificateFiles()))->fromText(
            is_string($body['php'] ?? null) ? $body['php'] : '',
            $expected,
        );
        $entityId = (string) $parsed->entityId;
        $errors = $parsed->errors;
        if ($expected === null && $parsed->document !== null) {
            $errors = [...$errors, ...(new EntityIdRules())->check($entityId)];
        }

        return EntityJson::respond([
            'errors' => EntityJson::errors($errors),
            'notices' => EntityJson::notices($parsed->notices),
            'warnings' => $parsed->document === null ? [] : $this->warnings->of($entityId, $parsed->document),
            'readable' => $parsed->document !== null,
        ]);
    }
}
