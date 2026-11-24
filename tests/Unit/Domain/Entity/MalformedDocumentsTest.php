<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Tests\Support\SpFixtures;

const MALFORMED = [
    'a text as the endpoints' => ['AssertionConsumerService', 'x'],
    'a text as an endpoint' => ['AssertionConsumerService', ['x']],
    'a text as the logout endpoints' => ['SingleLogoutService', 'x'],
    'a text as a logout endpoint' => ['SingleLogoutService', ['x']],
    'a text as the discovery endpoints' => ['DiscoveryResponse', 'x'],
    'a text as a discovery endpoint' => ['DiscoveryResponse', ['x']],
    'a text as the certificates' => ['certificates', 'x'],
    'a text as a certificate' => ['certificates', ['x']],
    'numbers in a certificate' => ['certificates', [['pem' => 5, 'use' => 5]]],
    'a text as extra' => ['extra', 'x'],
    'a text as the contacts' => ['contacts', 'x'],
    'a text as a contact' => ['contacts', ['x']],
    'a text as the attributes of a contact' => ['contacts', [['contactType' => 'other', 'attributes' => 'x']]],
    'a text as an attribute of a contact' => ['contacts', [['contactType' => 'other', 'attributes' => ['x']]]],
    'a text as the entity attributes' => ['EntityAttributes', 'x'],
    'a text as an entity attribute' => ['EntityAttributes', ['x']],
    'a text as the registration' => ['RegistrationInfo', 'x'],
    'a number as the registration instant' => ['RegistrationInfo', ['authority' => 'a', 'instant' => 5]],
];

it('reports a document of the wrong shape instead of failing', function (string $option, mixed $value): void {
    $document = SpFixtures::document('minimal');
    $document[$option] = $value;

    $errors = (new SpRemote())->check($document);

    expect($errors)->not->toBe([]);
})->with(MALFORMED);

it('shows a stored document of the wrong shape instead of failing', function (string $option, mixed $value): void {
    $document = SpFixtures::document('minimal');
    $document[$option] = $value;

    expect((new SpRemote())->toText('https://sp.example.org', $document))
        ->toStartWith("\$metadata['https://sp.example.org'] = [");
})->with(MALFORMED);

it('keeps every option when extra comes first in the document', function (): void {
    $core = (new SpRemote())->toCore(['extra' => ['consent.disable' => true]] + SpFixtures::document('minimal'));

    expect(array_keys($core))->toBe(['AssertionConsumerService', 'consent.disable']);
});
