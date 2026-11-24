<?php

declare(strict_types=1);

use SimpleSAML\Logger;
use SimpleSAML\Module\console\Infrastructure\Http\CsrfToken;
use SimpleSAML\Module\console\Tests\Support\ConsoleClient;
use SimpleSAML\Module\console\Tests\Support\Db;
use SimpleSAML\Session;

it('answers a request without a valid token with a plain 403, a log warning and no Audit trail row', function (
    array $data,
): void {
    $client = (new ConsoleClient())->withDatabase(null)->loginAsAdmin();
    $client->page();
    Logger::setCaptureLog();

    $response = $client->post('/migrate', $data);
    $log = implode("\n", Logger::getCapturedLog());
    Logger::setCaptureLog(false);

    expect($response->getStatusCode())->toBe(403)
        ->and(ConsoleClient::body($response))->toContain('request-forgery token')
        ->and(ConsoleClient::body($response))->toContain('href="http://localhost/simplesaml/module.php/console/"')
        ->and($log)->toContain('Console: refused a POST')
        ->and(Db::tableExists($client->database(), 'console_schema_version'))->toBeFalse()
        ->and(Db::tableExists($client->database(), 'console_audit'))->toBeFalse();
})->with([
    'missing' => [[]],
    'wrong' => [['_token' => 'not-the-token']],
    'empty' => [['_token' => '']],
]);

it('keeps one token for the whole session and compares it in constant time', function (): void {
    (new ConsoleClient())->loginAsAdmin();
    $tokens = new CsrfToken(Session::getSessionFromRequest());
    $token = $tokens->token();

    expect($token)->toMatch('/^[0-9a-f]{64}$/')
        ->and($tokens->token())->toBe($token)
        ->and($tokens->isValid($token))->toBeTrue()
        ->and($tokens->isValid($token . 'x'))->toBeFalse()
        ->and($tokens->isValid(null))->toBeFalse()
        ->and(file_get_contents(dirname(__DIR__, 2) . '/src/Infrastructure/Http/CsrfToken.php'))
            ->toContain('hash_equals(');
});

it('checks the database state before the token', function (): void {
    $client = (new ConsoleClient())->withDatabase([1, 2, 3, 10])->loginAsAdmin();

    $response = $client->post('/migrate', []);

    expect($response->getStatusCode())->toBe(200)
        ->and(ConsoleClient::body($response))->toContain('data-state="console-older"');
});
