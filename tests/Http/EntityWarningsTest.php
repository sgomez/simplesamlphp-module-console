<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Infrastructure\Http\EntityWarnings;

it('answers the messages of the warnings for the Application', function (): void {
    $warnings = new EntityWarnings();

    expect($warnings->of('saml20-sp-remote', 'not-a-uri', []))->toBe(['The entity ID is not an absolute URI.']);
});
