<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Infrastructure\Http;

use SimpleSAML\Module\console\Domain\Entity\Notice;
use SimpleSAML\Module\console\Domain\Entity\SpRemote;
use SimpleSAML\Module\console\Domain\Entity\ValidationError;
use SimpleSAML\Module\console\Domain\Php\PhpReader;
use SimpleSAML\Module\console\Infrastructure\Persistence\Repositories;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;

/**
 * The JSON of the edit screen's object. Every answer carries the PHP text, so none is cached.
 */
final class EntityJson
{
    public function __construct(
        private readonly Repositories $repositories,
        private readonly EntityWarnings $warnings,
    ) {
    }


    /**
     * The entity as it now stands, with the notices of the save that produced it; 404 when it has no row.
     *
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    public function current(string $set, string $entityId, int $status = 200, array $notices = []): JsonResponse
    {
        $entity = $this->repositories->entities()->find($set, $entityId);
        if ($entity === null) {
            return self::respond(['error' => 'not found'], 404);
        }
        $document = $entity->document;
        $sp = new SpRemote();
        $php = $document === null ? null : $sp->toText($entityId, $document);
        $errors = $php === null ? [] : $sp->fromText($php, $entityId)->errors;
        if ($document !== null) {
            $errors = StoredErrors::merge($errors, $sp->check($document));
        }

        return self::respond([
            'entityId' => $entityId,
            'name' => $entity->name(),
            'version' => $entity->version,
            'state' => $this->state($set, $entityId),
            'unreadable' => $document === null,
            'error' => $entity->loadError,
            'php' => $php,
            'raw' => $entity->raw === null ? null : mb_scrub($entity->raw, 'UTF-8'),
            'errors' => self::errors($errors),
            'warnings' => $document === null ? [] : $this->warnings->of($entityId, $document),
            'notices' => self::notices(NoticeLines::relocated((string) $php, $notices)),
        ], $status);
    }


    /**
     * The 422 of a save with errors.
     *
     * @param list<array<string, mixed>> $errors
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     */
    public static function refused(string $text, array $errors, array $notices): JsonResponse
    {
        return self::respond([
            'errors' => $errors,
            'notices' => self::notices($notices),
            'readable' => (new PhpReader())->read($text)->error === null,
        ], 422);
    }


    /**
     * @param array<string, mixed> $body
     */
    public static function respond(array $body, int $status = 200): JsonResponse
    {
        $response = new JsonResponse($body, $status);
        $response->headers->set('Cache-Control', 'no-store');

        return $response;
    }


    /**
     * The JSON body of a POST; an empty one when it does not hold an object.
     *
     * @return array<mixed>
     */
    public static function input(Request $request): array
    {
        $body = json_decode($request->getContent(), true);

        return is_array($body) ? $body : [];
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\ValidationError> $errors
     * @return list<array{pointer: string, message: string, line: ?int, column: ?int}>
     */
    public static function errors(array $errors): array
    {
        usort($errors, static fn (ValidationError $a, ValidationError $b): int => ($a->line ?? 0) <=> ($b->line ?? 0));

        return array_map(
            static fn (ValidationError $e): array
                => ['pointer' => $e->pointer, 'message' => $e->message, 'line' => $e->line, 'column' => $e->column],
            $errors,
        );
    }


    /**
     * @param list<\SimpleSAML\Module\console\Domain\Entity\Notice> $notices
     * @return list<array{message: string, option: ?string, line: ?int}>
     */
    public static function notices(array $notices): array
    {
        return array_map(
            static fn (Notice $n): array => ['message' => $n->message, 'option' => $n->option, 'line' => $n->line],
            $notices,
        );
    }


    private function state(string $set, string $entityId): ?string
    {
        foreach ($this->repositories->publication()->states() as $change) {
            if ($change->set === $set && $change->entityId === $entityId) {
                return $change->state->value;
            }
        }

        return null;
    }
}
