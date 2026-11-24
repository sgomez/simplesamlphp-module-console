<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Logger;
use SimpleSAML\Module\console\Domain\DatabaseState;
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
     * state, then, for a POST, the request-forgery token and the JSON content type.
     */
    public function guard(Request $request): ?JsonResponse
    {
        if (!$this->access->isAdmin()) {
            return new JsonResponse(['error' => 'unauthenticated'], 401);
        }
        $state = $this->database->status()->state;
        if ($state !== DatabaseState::Ready) {
            return new JsonResponse(['state' => $state->name], 503);
        }

        return $request->isMethod('POST') ? $this->guardPost($request) : null;
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
