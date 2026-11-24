<?php

declare(strict_types=1);

use SimpleSAML\Configuration;
use SimpleSAML\Module\admin\Event\ConfigPageEvent;
use SimpleSAML\Module\console\Event\Listener\ConfigPageListener;
use SimpleSAML\XHTML\Template;

it('adds a Console link to the Configuration tab', function (): void {
    Configuration::clearInternalState();
    $template = new Template(Configuration::getInstance(), 'admin:config.twig');
    $template->data['links'] = [];

    (new ConfigPageListener())(new ConfigPageEvent($template));

    expect($template->data['links'])->toHaveCount(1)
        ->and($template->data['links'][0]['text'])->toBe('Console')
        ->and($template->data['links'][0]['href'])->toEndWith('/module.php/console');
});

it('never breaks the Configuration tab', function (): void {
    $event = new ConfigPageEvent(new Template(Configuration::getInstance(), 'admin:config.twig'));
    $event->getTemplate()->data['links'] = 'not a list';

    (new ConfigPageListener())($event);

    expect($event->getTemplate()->data['links'])->toBe('not a list');
});
