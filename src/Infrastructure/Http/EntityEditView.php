<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;
use SimpleSAML\XHTML\Template;

final class EntityEditView
{
    public function __construct(private readonly PageFactory $pages)
    {
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @param array<string, mixed> $extra
     */
    public function render(
        string $entityId,
        ?int $version,
        string $text,
        array $errors = [],
        int $status = 200,
        array $extra = [],
    ): Template {
        $located = array_values(array_filter($errors, static fn (ValidationError $e): bool => $e->line !== null));
        $lines = array_map(static fn (ValidationError $e): int => (int) $e->line, $located);
        $identity = array_values(array_filter($errors, static fn (ValidationError $e): bool => $e->line === null));

        return $this->pages->make('entity/edit.twig', $extra + [
            'entityId' => $entityId,
            'isNew' => $version === null,
            'version' => $version,
            'text' => $text,
            'errors' => array_map($this->error(...), $this->sorted($errors)),
            'identityErrors' => array_map(static fn (ValidationError $e): string => $e->message, $identity),
            'errorLines' => array_values(array_unique($lines)),
            'lineCount' => substr_count($text, "\n") + 1,
            'saveUrl' => Module::getModuleURL('console/entities/' . SpRemote::SET . '/save'),
            'deleteUrl' => Module::getModuleURL('console/entities/' . SpRemote::SET . '/delete'),
            'listUrl' => Module::getModuleURL('console/entities/' . SpRemote::SET),
            'set' => SpRemote::SET,
        ], $status);
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @return list<\SimpleSAML\Module\console\Domain\Entity\ValidationError>
     */
    private function sorted(array $errors): array
    {
        usort($errors, static fn (ValidationError $a, ValidationError $b): int => ($a->line ?? 0) <=> ($b->line ?? 0));

        return $errors;
    }


    /**
     * @return array{line: ?int, column: ?int, message: string}
     */
    private function error(ValidationError $error): array
    {
        return ['line' => $error->line, 'column' => $error->column, 'message' => $error->message];
    }
}
