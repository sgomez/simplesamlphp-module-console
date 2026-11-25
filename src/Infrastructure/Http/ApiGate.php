<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Logger;
use SimpleSAML\Module\console\Domain\DatabaseState;
use SimpleSAML\Module\console\Domain\SqliteVersion;
use SimpleSAML\Module\console\Infrastructure\Persistence\DatabaseReading;
use SimpleSAML\Module\console\Infrastructure\Persistence\MigrationCatalog;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

final class ApiGate
{
    public const string TOKEN_HEADER = 'X-Console-Token';


    public function __construct(
        private readonly AdminAccess $access,
        private readonly DatabaseGate $database,
        private readonly CsrfToken $token,
    ) {
    }


    /**
     * The response that stops an API request, or null when it may go on: the admin session, then the database
     * state (pending migrations let Run migrations through), then, for a POST, the request-forgery token and the
     * JSON content type.
     */
    public function guard(Request $request, bool $migrating = false): ?JsonResponse
    {
        if (!$this->access->isAdmin()) {
            return new JsonResponse(['error' => 'unauthenticated'], 401);
        }
        $reading = $this->database->reading();
        $state = $reading->status->state;
        if ($state !== DatabaseState::Ready && !($migrating && $state === DatabaseState::MigrationsPending)) {
            return $this->refusal($reading);
        }

        return $request->isMethod('POST') ? $this->guardPost($request) : null;
    }


    /**
     * The 503 of a database that is not ready: what its state page shows, and the sidebar's identity and links.
     */
    public function refusal(DatabaseReading $reading): JsonResponse
    {
        $status = $reading->status;

        return new JsonResponse([
            'state' => $status->state->name,
            'known' => $status->known,
            'highest' => $status->highest,
            'missing' => array_map(
                static fn (int $number): array => ['number' => $number, 'title' => MigrationCatalog::title($number)],
                $status->missing,
            ),
            'sqliteVersion' => $status->sqliteVersion,
            'sqliteMinimum' => SqliteVersion::MINIMUM,
            'detail' => $reading->failure,
            'session' => $this->access->links(),
        ], 503);
    }


    private function guardPost(Request $request): ?JsonResponse
    {
        if (!$this->token->isValid($request->headers->get(self::TOKEN_HEADER))) {
            Logger::warning(
                'Console: refused a POST to ' . $request->getPathInfo() . ' without a valid request-forgery token',
            );

            return new JsonResponse(['error' => 'refused'], 403);
        }
        if ($request->getContentTypeFormat() !== 'json') {
            return new JsonResponse(['error' => 'unsupported media type'], 415);
        }

        return null;
    }
}
