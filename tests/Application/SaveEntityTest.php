<?php

declare(strict_types=1);

use SimpleSAML\Module\console\Application\SaveOutcome;
use SimpleSAML\Module\console\Tests\Support\EntityDb;

const BODY = "'AssertionConsumerService' => [['Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', "
    . "'Location' => 'https://a.example.org/acs']]";

it('creates an entity from a block with its wrapper', function (): void {
    [$save, $repository] = EntityDb::saver();

    $result = $save->create('', "\$metadata['https://sp.example.org'] = [" . BODY . '];', 'alice');

    expect($result->outcome)->toBe(SaveOutcome::Saved)
        ->and($result->entityId)->toBe('https://sp.example.org')
        ->and($result->version)->toBe(1)
        ->and($result->text)->toStartWith("\$metadata['https://sp.example.org'] = [\n")
        ->and($repository->find('saml20-sp-remote', 'https://sp.example.org'))->not->toBeNull();
});

it('creates an entity with the entity ID of the identity field and a bare array', function (): void {
    [$save] = EntityDb::saver();

    $result = $save->create('https://sp.example.org', '[' . BODY . ']', 'alice');

    expect($result->outcome)->toBe(SaveOutcome::Saved)
        ->and($result->normalised)->toBeTrue();
});

it('says the text was not changed when it already is in schema order', function (): void {
    [$save] = EntityDb::saver();
    $first = $save->create('https://sp.example.org', '[' . BODY . ']', 'alice');

    $second = $save->edit('https://sp.example.org', 1, (string) $first->text, 'alice');

    expect($second->outcome)->toBe(SaveOutcome::Saved)
        ->and($second->normalised)->toBeFalse()
        ->and($second->version)->toBe(2);
});

it('reports the errors of the entity ID, the schema and the rules together and stores nothing', function (): void {
    [$save, $repository] = EntityDb::saver();

    $text = "[\n'AssertionConsumerService' => [['Binding' => 'x y', 'Location' => 'ftp://a']],\n"
        . "'attributes' => ['uid'],\n]";
    $result = $save->create('', $text, 'alice');

    expect($result->outcome)->toBe(SaveOutcome::Invalid)
        ->and(array_map(static fn ($e): string => $e->pointer, $result->errors))
        ->toBe(['/attributes', '/AssertionConsumerService/0/Binding', '/AssertionConsumerService/0/Location', ''])
        ->and($repository->all('saml20-sp-remote'))->toBe([]);
});

it('does not save text that cannot be read', function (): void {
    [$save] = EntityDb::saver();

    $result = $save->create('https://sp.example.org', "['a' => phpinfo()]", 'alice');

    expect($result->outcome)->toBe(SaveOutcome::Invalid)
        ->and($result->errors[0]->line)->toBe(1);
});

it('says an entity already exists instead of overwriting it', function (): void {
    [$save, $repository] = EntityDb::saver();
    $save->create('https://sp.example.org', '[' . BODY . ']', 'alice');

    $result = $save->create('https://sp.example.org', '[' . BODY . ", 'scope' => ['x.example.org']]", 'bob');

    expect($result->outcome)->toBe(SaveOutcome::AlreadyExists)
        ->and($repository->find('saml20-sp-remote', 'https://sp.example.org')?->version)->toBe(1);
});

it('rejects an edit made on a stale version', function (): void {
    [$save, $repository] = EntityDb::saver();
    $save->create('https://sp.example.org', '[' . BODY . ']', 'alice');
    $save->edit('https://sp.example.org', 1, '[' . BODY . ", 'scope' => ['a.example.org']]", 'alice');

    $result = $save->edit('https://sp.example.org', 1, '[' . BODY . ", 'scope' => ['b.example.org']]", 'bob');

    expect($result->outcome)->toBe(SaveOutcome::Conflict)
        ->and($repository->find('saml20-sp-remote', 'https://sp.example.org')?->document['scope'] ?? null)
        ->toBe(['a.example.org']);
});

it('rejects an edit whose block is another entity', function (): void {
    [$save] = EntityDb::saver();
    $save->create('https://sp.example.org', '[' . BODY . ']', 'alice');

    $other = "\$metadata['https://other.example.org'] = [" . BODY . '];';
    $result = $save->edit('https://sp.example.org', 1, $other, 'alice');

    expect($result->outcome)->toBe(SaveOutcome::Invalid);
});
