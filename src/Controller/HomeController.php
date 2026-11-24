<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Controller;

use SimpleSAML\Module;
use SimpleSAML\Module\console\Infrastructure\Http\RequestGate;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Response;

final class HomeController
{
    public function __construct(private readonly RequestGate $gate)
    {
    }


    public function main(): Response
    {
        return $this->gate->guardGet()
            ?? new RedirectResponse(Module::getModuleURL('console/entities/saml20-sp-remote'));
    }
}
