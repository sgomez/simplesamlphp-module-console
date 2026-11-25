<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller\Api;

use SimpleSAML\Module\console\Application\ListEntities;
use SimpleSAML\Module\console\Application\ListFilter;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;
use SimpleSAML\Module\console\Domain\Publication\SnapshotContent;
use SimpleSAML\Module\console\Infrastructure\Http\ApiGate;
use SimpleSAML\Module\console\Infrastructure\Http\EntityWarnings;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class EntityListController
{
    public function __construct(
        private readonly ApiGate $gate,
        private readonly Repositories $repositories,
        private readonly EntityWarnings $warnings,
    ) {
    }


    public function list(Request $request, string $set): JsonResponse
    {
        $stopped = $this->gate->guard($request);
        if ($stopped !== null) {
            return $stopped;
        }
        $changes = $this->repositories->publication()->states();
        $states = [];
        foreach ($changes as $change) {
            $states[$change->set . "\0" . $change->entityId] = $change->state->value;
        }
        $live = $this->repositories->currentContent();
        $page = (new ListEntities($this->repositories->entities(), $this->warnings))->page(
            $set,
            (string) $request->query->get('q', ''),
            $request->query->getInt('page', 1),
            ListFilter::tryFrom((string) $request->query->get('filter', '')) ?? ListFilter::All,
            $changes,
        );

        return new JsonResponse([
            'rows' => array_map(fn (StoredEntity $entity): array => $this->row($entity, $states, $live), $page->rows),
            'total' => $page->total,
            'page' => $page->page,
            'pages' => $page->pages,
            'perPage' => ListEntities::PER_PAGE,
            'query' => $page->query,
            'filter' => $page->filter->value,
            'counts' => $page->counts,
        ]);
    }


    /**
     * @param array<string, string> $states
     * @return array<string, mixed>
     */
    private function row(StoredEntity $entity, array $states, SnapshotContent $live): array
    {
        $labels = [];
        $entity->enabled || $labels[] = ['text' => 'Disabled', 'kind' => 'disabled', 'title' => null];
        $errors = $entity->document === null ? [] : (new SpRemote())->check($entity->document);
        $errors === [] || $labels[] = [
            'text' => 'Errors',
            'kind' => 'error',
            'title' => implode("\n", array_map(
                static fn (ValidationError $e): string => ($e->pointer === '' ? '' : $e->pointer . ': ') . $e->message,
                $errors,
            )),
        ];
        $warnings = $entity->document === null ? [] : $this->warnings->labels($entity->entityId, $entity->document);
        foreach ($warnings as $w) {
            $labels[] = ['text' => $w['label'], 'kind' => 'warning', 'title' => $w['message']];
        }

        return [
            'entityId' => $entity->entityId,
            'name' => $entity->name(),
            'state' => $states[$entity->set . "\0" . $entity->entityId] ?? null,
            'labels' => $labels,
            'unreadable' => $entity->document === null,
            'inSnapshot' => $live->document($entity->set, $entity->entityId) !== null,
            'error' => $entity->loadError,
        ];
    }
}
