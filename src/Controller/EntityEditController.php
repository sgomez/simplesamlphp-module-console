<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Infrastructure\Http\EntityEditView;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use Symfony\Component\HttpFoundation\Response;

final class EntityEditController
{
    public function __construct(
        private readonly RequestGate $gate,
        private readonly EntityEditView $view,
    ) {
    }


    public function add(string $set): Response
    {
        return $this->gate->guardGet() ?? $this->view->render('', null, (new SpRemote())->starterText());
    }
}
