<?php

// THROWAWAY PROTOTYPE. Schema-driven form binding, view model and validation.

declare(strict_types=1);

use Opis\JsonSchema\Errors\ErrorFormatter;
use Opis\JsonSchema\Errors\ValidationError;
use Opis\JsonSchema\Validator;

const SECRET_REF = '/^%(secret|env)\([A-Za-z0-9_]+\)%$/';

final class Absent
{
}

function absent(): Absent
{
    static $a;
    return $a ??= new Absent();
}

function isObjectList(object $s): bool
{
    return ($s->type ?? '') === 'array' && ($s->items->type ?? '') === 'object';
}

function active(object $s, object $siblings): bool
{
    foreach ((array) ($s->{'x-when'} ?? []) as $p => $allowed) {
        if (!in_array($siblings->$p ?? null, $allowed, true)) {
            return false;
        }
    }
    return true;
}

/** Reindexes every list so that positions match JSON pointers. */
function normalise(object $s, mixed $raw): mixed
{
    if (($s->type ?? '') === 'object') {
        $raw = is_array($raw) ? $raw : [];
        foreach ($s->properties as $k => $ps) {
            if (isset($raw[$k])) {
                $raw[$k] = normalise($ps, $raw[$k]);
            }
        }
        return $raw;
    }
    if (isObjectList($s)) {
        return array_map(fn ($i) => normalise($s->items, $i), array_values(is_array($raw) ? $raw : []));
    }
    return $raw;
}

/** Stored document -> the shape a POST has. Sensitive values never leave. */
function toRaw(object $s, mixed $v): mixed
{
    $type = $s->type ?? 'string';
    if ($type === 'object') {
        $out = [];
        foreach ($s->properties as $k => $ps) {
            if (is_object($v) && isset($v->$k)) {
                $out[$k] = toRaw($ps, $v->$k);
            }
        }
        return $out;
    }
    if (isObjectList($s)) {
        $out = [];
        foreach ((array) $v as $i => $item) {
            $out[] = ['__origin' => (string) $i] + toRaw($s->items, $item);
        }
        return $out;
    }
    if ($type === 'array') {
        return implode("\n", (array) $v);
    }
    if ($type === 'boolean') {
        return $v ? '1' : '';
    }
    if (!empty($s->{'x-sensitive'})) {
        return preg_match(SECRET_REF, (string) $v) ? $v : '';
    }
    return (string) $v;
}

/** Submitted strings -> document, coerced by the schema. */
function bind(object $s, mixed $raw, mixed $stored): mixed
{
    $type = $s->type ?? 'string';
    if ($type === 'object') {
        $raw = is_array($raw) ? $raw : [];
        $out = new stdClass();
        foreach ($s->properties as $k => $ps) {
            $st = is_object($stored) ? ($stored->$k ?? null) : null;
            $v = bind($ps, $raw[$k] ?? null, $st);
            $keep = !empty($ps->{'x-sensitive'}) && $v instanceof Absent && empty($raw[$k . '__clear'])
                && is_string($st) && !preg_match(SECRET_REF, $st);
            if ($keep) {
                $v = $st;
            }
            if (!$v instanceof Absent) {
                $out->$k = $v;
            }
        }
        foreach ($s->properties as $k => $ps) {
            if (!active($ps, $out)) {
                unset($out->$k);
            }
        }
        return (array) $out === [] ? absent() : $out;
    }
    if (isObjectList($s)) {
        $out = [];
        foreach (is_array($raw) ? $raw : [] as $item) {
            $o = is_array($item) && ($item['__origin'] ?? '') !== '' ? (int) $item['__origin'] : null;
            $v = bind($s->items, $item, $o !== null && is_array($stored) ? ($stored[$o] ?? null) : null);
            $out[] = $v instanceof Absent ? new stdClass() : $v;
        }
        return $out === [] ? absent() : $out;
    }
    if ($type === 'array') {
        $lines = array_values(array_filter(array_map('trim', preg_split('/\R/', is_string($raw) ? $raw : ''))));
        return $lines === [] ? absent() : $lines;
    }
    if ($type === 'boolean') {
        return is_string($raw) && $raw !== '';
    }
    $r = is_string($raw) ? trim($raw) : '';
    if ($r === '') {
        return absent();
    }
    if ($type === 'integer') {
        return preg_match('/^-?\d+$/', $r) ? (int) $r : $r;
    }
    return $r;
}

function applyAction(array &$raw, string $action): void
{
    [$op, $ptr] = explode(':', $action, 2) + [1 => ''];
    $seg = array_values(array_filter(explode('/', $ptr), fn ($x) => $x !== ''));
    $i = $op === 'add' ? 0 : (int) array_pop($seg);
    $ref = &$raw;
    foreach ($seg as $x) {
        if (!isset($ref[$x]) || !is_array($ref[$x])) {
            $ref[$x] = [];
        }
        $ref = &$ref[$x];
    }
    $swap = function (int $a, int $b) use (&$ref): void {
        if (isset($ref[$a], $ref[$b])) {
            [$ref[$a], $ref[$b]] = [$ref[$b], $ref[$a]];
        }
    };
    match ($op) {
        'add' => $ref[] = [],
        'remove' => array_splice($ref, $i, 1),
        'up' => $swap($i, $i - 1),
        'down' => $swap($i, $i + 1),
        default => null,
    };
}

function errorCount(array $errors, string $ptr): int
{
    $n = 0;
    foreach ($errors as $p => $list) {
        if ($p === $ptr || str_starts_with($p, $ptr . '/')) {
            $n += count($list);
        }
    }
    return $n;
}

/** Schema + submitted strings + errors -> the tree the Twig templates walk. */
function view(object $s, mixed $raw, mixed $stored, string $name, string $ptr, array $errors, int $depth = 0, string $key = '', bool $required = false): array
{
    $n = [
        'key' => $key,
        'name' => $name,
        'pointer' => $ptr,
        'id' => 'f' . preg_replace('/[^A-Za-z0-9]+/', '-', $ptr),
        'title' => $s->title ?? $key,
        'description' => $s->description ?? '',
        'required' => $required,
        'errors' => $errors[$ptr] ?? [],
        'errorCount' => errorCount($errors, $ptr),
        'when' => null,
        'active' => true,
        'controls' => false,
    ];
    $type = $s->type ?? 'string';

    if ($type === 'object') {
        $raw = is_array($raw) ? $raw : [];
        $coerced = new stdClass();
        foreach ($s->properties as $k => $ps) {
            if (in_array($ps->type ?? 'string', ['object', 'array'], true)) {
                continue;
            }
            $v = bind($ps, $raw[$k] ?? null, null);
            if (!$v instanceof Absent) {
                $coerced->$k = $v;
            }
        }
        $req = $s->required ?? [];
        if (isset($s->if->properties)) {
            $ok = true;
            foreach ($s->if->properties as $p => $c) {
                $ok = $ok && property_exists($c, 'const') && ($coerced->$p ?? null) === $c->const;
            }
            $branch = $ok ? ($s->then ?? null) : ($s->else ?? null);
            $req = array_merge($req, $branch->required ?? []);
        }
        $children = [];
        $controls = [];
        foreach ($s->properties as $k => $ps) {
            $c = view($ps, $raw[$k] ?? null, is_object($stored) ? ($stored->$k ?? null) : null, "{$name}[$k]", "$ptr/$k", $errors, $depth, $k, in_array($k, $req, true));
            foreach ((array) ($ps->{'x-when'} ?? []) as $p => $allowed) {
                $c['when'] = [
                    'name' => "{$name}[$p]",
                    'title' => $s->properties->$p->title ?? $p,
                    'values' => array_map(fn ($a) => is_bool($a) ? ($a ? 'true' : 'false') : (string) $a, $allowed),
                ];
                $controls[$p] = true;
            }
            $c['active'] = active($ps, $coerced);
            $children[$k] = $c;
        }
        foreach ($controls as $p => $_) {
            $children[$p]['controls'] = true;
        }
        return $n + ['kind' => 'object', 'children' => array_values($children)];
    }

    if (isObjectList($s)) {
        $items = [];
        foreach (is_array($raw) ? array_values($raw) : [] as $i => $item) {
            $o = is_array($item) && ($item['__origin'] ?? '') !== '' ? (int) $item['__origin'] : null;
            $it = view($s->items, $item, $o !== null && is_array($stored) ? ($stored[$o] ?? null) : null, "{$name}[$i]", "$ptr/$i", $errors, $depth + 1, (string) $i);
            $it['origin'] = $o === null ? '' : (string) $o;
            $items[] = $it;
        }
        $ph = "__I{$depth}__";
        $tpl = view($s->items, [], null, "{$name}[$ph]", "$ptr/$ph", [], $depth + 1);
        $tpl['origin'] = '';
        $flat = true;
        $columns = [];
        foreach ($s->items->properties as $k => $ps) {
            $flat = $flat && !isObjectList($ps) && ($ps->type ?? '') !== 'object';
            $columns[] = $ps->title ?? $k;
        }
        return $n + [
            'kind' => 'list',
            'items' => $items,
            'template' => $tpl,
            'depth' => $depth,
            'flat' => $flat,
            'columns' => $columns,
            'itemTitle' => $s->items->title ?? 'item',
        ];
    }

    $sensitive = !empty($s->{'x-sensitive'});
    $value = is_string($raw) ? $raw : '';
    $widget = match (true) {
        $type === 'boolean' => 'checkbox',
        isset($s->enum) => $s->{'x-widget'} ?? 'select',
        $type === 'array' => 'lines',
        $sensitive => preg_match(SECRET_REF, $value) ? 'text' : 'password',
        $type === 'integer' => 'number',
        default => $s->{'x-widget'} ?? 'text',
    };
    $hasStored = $sensitive && is_string($stored) && $stored !== '' && !preg_match(SECRET_REF, $stored);
    $example = $s->examples[0] ?? $s->default ?? '';
    return $n + [
        'kind' => 'scalar',
        'widget' => $widget,
        'value' => $value,
        'options' => array_map('strval', $s->enum ?? []),
        'placeholder' => is_scalar($example) && !is_bool($example) ? (string) $example : '',
        'sensitive' => $sensitive,
        'hasStored' => $hasStored,
        'clearName' => $hasStored && !$required ? substr($name, 0, -1) . '__clear]' : null,
    ];
}

function collectErrors(ValidationError $e, ErrorFormatter $f, array &$out): void
{
    if ($e->subErrors()) {
        foreach ($e->subErrors() as $sub) {
            collectErrors($sub, $f, $out);
        }
        return;
    }
    $path = $e->data()->fullPath();
    $ptr = $path ? '/' . implode('/', $path) : '';
    if ($e->keyword() === 'required') {
        foreach ($e->args()['missing'] as $m) {
            $out["$ptr/$m"][] = 'This field is required.';
        }
        return;
    }
    $out[$ptr][] = $f->formatErrorMessage($e);
}

/** @return array<string, list<string>> errors by JSON pointer */
function validateDocument(string $type, object $schema, object $doc): array
{
    $validator = new Validator();
    $validator->setMaxErrors(-1);
    $validator->setStopAtFirstError(false);
    $errors = [];
    $result = $validator->validate($doc, $schema);
    if ($result->hasError()) {
        collectErrors($result->error(), new ErrorFormatter(), $errors);
    }

    // Stand-in for the cross-field rules that live in the Authsource type class.
    if ($type === 'sql') {
        $names = [];
        foreach ($doc->databases ?? [] as $i => $db) {
            if (isset($db->name) && in_array($db->name, $names, true)) {
                $errors["/databases/$i/name"][] = "There is already a database named \"{$db->name}\".";
            }
            $names[] = $db->name ?? null;
            if (str_contains($db->dsn ?? '', 'password=')) {
                $errors["/databases/$i/dsn"][] = 'The DSN must not carry a password; use the password field.';
            }
        }
        foreach (['auth_queries', 'attr_queries'] as $list) {
            foreach ($doc->$list ?? [] as $i => $q) {
                if (isset($q->database) && !in_array($q->database, $names, true)) {
                    $errors["/$list/$i/database"][] = "No database is named \"{$q->database}\".";
                }
            }
        }
    }
    if ($type === 'userpass') {
        $seen = [];
        foreach ($doc->users ?? [] as $i => $u) {
            if (isset($u->username) && in_array($u->username, $seen, true)) {
                $errors["/users/$i/username"][] = "There is already a user named \"{$u->username}\".";
            }
            $seen[] = $u->username ?? null;
        }
    }
    return $errors;
}
