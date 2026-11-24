<?php

declare(strict_types=1);

const ROOT_NS = 'SimpleSAML\\Module\\console';

arch('the domain depends on nothing but itself')
    ->expect(ROOT_NS . '\\Domain')
    ->toOnlyUse(ROOT_NS . '\\Domain');

arch('the application layer depends on the domain only')
    ->expect(ROOT_NS . '\\Application')
    ->toOnlyUse([ROOT_NS . '\\Domain', ROOT_NS . '\\Application']);

arch('inner layers never reach outwards')
    ->expect([ROOT_NS . '\\Domain', ROOT_NS . '\\Application'])
    ->not->toUse([
        ROOT_NS . '\\Infrastructure',
        ROOT_NS . '\\Controller',
        ROOT_NS . '\\Event',
        ROOT_NS . '\\MetadataStore',
        'PDO',
        'Symfony\\Component\\HttpFoundation',
    ]);

arch('PDO stays in the persistence namespace')
    ->expect('PDO')
    ->toOnlyBeUsedIn(ROOT_NS . '\\Infrastructure\\Persistence');

arch('the serving side stays off persistence')
    ->expect(ROOT_NS . '\\MetadataStore')
    ->not->toUse(ROOT_NS . '\\Infrastructure\\Persistence');

arch('every file declares strict types')
    ->expect(ROOT_NS)
    ->toUseStrictTypes();

arch('classes are final')
    ->expect(ROOT_NS)
    ->classes()
    ->toBeFinal();

arch('no debug functions')
    ->expect(ROOT_NS)
    ->not->toUse(['dump', 'dd', 'var_dump', 'var_export', 'print_r', 'die', 'exit']);
