<?php

declare(strict_types=1);

use SimpleSAML\Logger;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Tests\Support\Api;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Db;
use SimpleSAML\Module\console\Tests\Support\EntityApi;
use SimpleSAML\Module\console\Tests\Support\EntityPages;
use SimpleSAML\Session;

it('answers a request without a valid token with 403, a log warning and no Audit trail row', function (
    array $headers,
): void {
    $client = (new ConsoleClient())->withDatabase(null)->loginAsAdmin();
    Logger::setCaptureLog();

    $response = $client->api('POST', '/migrate', $headers + ['CONTENT_TYPE' => 'application/json'], '{}');
    $log = implode("\n", Logger::getCapturedLog());
    Logger::setCaptureLog(false);

    expect($response->getStatusCode())->toBe(403)
        ->and(Api::json($response))->toBe(['error' => 'refused'])
        ->and($log)->toContain('Console: refused a POST')
        ->and(Db::tableExists($client->database(), 'console_schema_version'))->toBeFalse()
        ->and(Db::tableExists($client->database(), 'console_audit'))->toBeFalse();
})->with([
    'missing' => [[]],
    'wrong' => [['HTTP_X_CONSOLE_TOKEN' => 'not-the-token']],
    'empty' => [['HTTP_X_CONSOLE_TOKEN' => '']],
]);

it('deletes nothing and writes no Audit trail row on a forged delete', function (): void {
    $client = EntityApi::existing();

    $response = $client->api('POST', EntityApi::DELETE, [
        'HTTP_X_CONSOLE_TOKEN' => 'forged',
        'CONTENT_TYPE' => 'application/json',
    ], json_encode(['entityid' => EntityApi::ID], JSON_THROW_ON_ERROR));

    expect($response->getStatusCode())->toBe(403)
        ->and(EntityPages::count($client, 'console_entity'))->toBe(1)
        ->and(EntityPages::count($client, 'console_audit', "action = 'delete'"))->toBe(0);
});

it('keeps one token for the whole session and compares it in constant time', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    $tokens = new CsrfToken(Session::getSessionFromRequest());
    $token = $tokens->token();

    expect($token)->toMatch('/^[0-9a-f]{64}$/')
        ->and($tokens->token())->toBe($token)
        ->and($tokens->isValid($token))->toBeTrue()
        ->and($tokens->isValid($token . 'x'))->toBeFalse()
        ->and($tokens->isValid(null))->toBeFalse()
        ->and(file_get_contents(dirname(__DIR__, 3) . '/src/Infrastructure/Http/CsrfToken.php'))
            ->toContain('hash_equals(');
});

it('checks the database state before the token', function (): void {
    $client = (new ConsoleClient())->withDatabase([1, 2, 3, 10])->loginAsAdmin();

    $response = $client->api('POST', '/migrate', ['CONTENT_TYPE' => 'application/json'], '{}');

    expect($response->getStatusCode())->toBe(503)
        ->and(Api::json($response)['state'])->toBe('ConsoleOlder');
});
