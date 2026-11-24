<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Event\Listener;

use SimpleSAML\Module;
use SimpleSAML\Module\admin\Event\ConfigPageEvent;

final class ConfigPageListener
{
    public function __invoke(ConfigPageEvent $event): void
    {
        try {
            $template = $event->getTemplate();
            $links = $template->data['links'] ?? [];
            if (is_array($links)) {
                $links[] = ['href' => Module::getModuleURL('console'), 'text' => 'Console'];
                $template->data['links'] = $links;
            }
        } catch (\Throwable) {
            // core's admin page must never break because of the Console
        }
    }
}
