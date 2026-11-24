<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Domain\Entity\InverseForms;
use SimpleSAML\Module\console\Domain\Entity\ParsedEntity;
use SimpleSAML\Module\console\Domain\Entity\StoredEntity;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;

it('turns a plain string into the language map and passes anything else through', function (): void {
    expect(InverseForms::language('x'))->toBe(['en' => 'x'])
        ->and(InverseForms::language(['es' => 'y']))->toBe(['es' => 'y'])
        ->and(InverseForms::stringList('x'))->toBe(['x'])
        ->and(InverseForms::stringList(['a', 'b']))->toBe(['a', 'b'])
        ->and(InverseForms::stringList(5))->toBe(5);
});

it('gives an endpoint without binding the default one of its service', function (): void {
    $post = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';
    $redirect = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';
    $endpoints = [3 => ['Location' => 'https://a'], 7 => ['Binding' => 'urn:x:y', 'Location' => 'https://b'], 'bad'];

    expect(InverseForms::endpoints('AssertionConsumerService', $endpoints))->toBe([
        ['Binding' => $post, 'Location' => 'https://a'],
        ['Binding' => 'urn:x:y', 'Location' => 'https://b'],
        'bad',
    ])->and(InverseForms::endpoints('SingleLogoutService', [['Location' => 'https://a']]))
        ->toBe([['Binding' => $redirect, 'Location' => 'https://a']])
        ->and(InverseForms::endpoints('DiscoveryResponse', [['Location' => 'https://a']]))
        ->toBe([['Location' => 'https://a']])
        ->and(InverseForms::endpoints('AssertionConsumerService', 'x'))->toBe('x');
});

it('drops the empty members of UIInfo and of a contact', function (): void {
    expect(InverseForms::uiInfo(['DisplayName' => ['en' => 'x'], 'Logo' => [], 'Keywords' => []]))
        ->toBe(['DisplayName' => ['en' => 'x']])
        ->and(InverseForms::uiInfo('x'))->toBe('x')
        ->and(InverseForms::contacts([
            ['contactType' => 'other', 'emailAddress' => 'a@b', 'telephoneNumber' => [], 'attributes' => ['k' => 'v']],
            'bad',
        ]))->toBe([
            ['contactType' => 'other', 'emailAddress' => ['a@b'], 'attributes' => [['name' => 'k', 'value' => 'v']]],
            'bad',
        ])
        ->and(InverseForms::contacts('x'))->toBe('x');
});

it('turns the maps of EntityAttributes and RegistrationInfo into rows and dates', function (): void {
    expect(InverseForms::entityAttributes(['n' => 'v', 'm' => ['a', 'b']]))
        ->toBe([['name' => 'n', 'values' => ['v']], ['name' => 'm', 'values' => ['a', 'b']]])
        ->and(InverseForms::entityAttributes('x'))->toBe('x')
        ->and(InverseForms::registration(['authority' => 'a', 'instant' => 0, 'policies' => []]))
        ->toBe(['authority' => 'a', 'instant' => '1970-01-01T00:00:00Z'])
        ->and(InverseForms::registration(['instant' => 'text']))->toBe(['instant' => 'text'])
        ->and(InverseForms::registration('x'))->toBe('x');
});

it('names a stored entity by its English name, else by the first one it has', function (): void {
    $entity = static fn (?array $document): StoredEntity => new StoredEntity('s', 'id', true, 1, $document);

    expect($entity(['name' => ['es' => 'Hola', 'en' => 'Hello']])->name())->toBe('Hello')
        ->and($entity(['name' => ['es' => 'Hola']])->name())->toBe('Hola')
        ->and($entity(['name' => []])->name())->toBeNull()
        ->and($entity(['name' => 'x'])->name())->toBeNull()
        ->and($entity(['name' => ['en' => 5]])->name())->toBeNull()
        ->and($entity([])->name())->toBeNull()
        ->and($entity(null)->name())->toBeNull();
});

it('is valid only with a document and without errors', function (): void {
    expect((new ParsedEntity('id', []))->isValid())->toBeTrue()
        ->and((new ParsedEntity('id', null))->isValid())->toBeFalse()
        ->and((new ParsedEntity('id', [], [new ValidationError('', 'x')]))->isValid())->toBeFalse();
});
