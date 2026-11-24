<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Application\EntityPage;
use SimpleSAML\Module\console\Application\ListEntities;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Infrastructure\Http\PageFactory;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;

final class EntityListController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly PageFactory $pages,
        private readonly Repositories $repositories,
    ) {
    }


    public function list(Request $request, string $set): Response
    {
        $stopped = $this->gate->guardGet();
        if ($stopped !== null) {
            return $stopped;
        }
        $states = [];
        foreach ($this->repositories->publication()->states() as $change) {
            $states[$change->set . "\0" . $change->entityId] = $change->state->value;
        }
        $listing = new ListEntities($this->repositories->entities());
        $page = $listing->page($set, (string) $request->query->get('q', ''), $request->query->getInt('page', 1));

        return $this->pages->make('entity/list.twig', [
            'rows' => array_map(fn (StoredEntity $entity): array => $this->row($entity, $states), $page->rows),
            'total' => $page->total,
            'query' => $page->query,
            'page' => $page->page,
            'pages' => $page->pages,
            'previousUrl' => $page->page > 1 ? $this->url($page, $page->page - 1) : null,
            'nextUrl' => $page->page < $page->pages ? $this->url($page, $page->page + 1) : null,
            'listUrl' => Module::getModuleURL('console/entities/' . $set),
            'newUrl' => Module::getModuleURL('console/entities/' . $set . '/new'),
        ]);
    }


    /**
     * @param array<string, string> $states
     * @return array<string, mixed>
     */
    private function row(StoredEntity $entity, array $states): array
    {
        $labels = [];
        $entity->enabled || $labels[] = ['text' => 'Disabled', 'title' => ''];

        return [
            'entityId' => $entity->entityId,
            'name' => $entity->name(),
            'state' => $states[$entity->set . "\0" . $entity->entityId] ?? '',
            'labels' => $labels,
            'editUrl' => $entity->document === null ? null : Module::getModuleURL(
                'console/entities/' . $entity->set . '/edit',
                ['entityid' => $entity->entityId],
            ),
            'error' => $entity->loadError,
        ];
    }


    private function url(EntityPage $page, int $number): string
    {
        $query = ['page' => $number] + ($page->query === '' ? [] : ['q' => $page->query]);

        return Module::getModuleURL('console/entities/saml20-sp-remote', $query);
    }
}
