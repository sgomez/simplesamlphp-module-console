<?php

// THROWAWAY PROTOTYPE for "Authsource form rendered from JSON Schema in Twig".
// Three variants of one authsource edit form, switchable via ?variant=A|B|C, on a standalone
// page (the module has no pages yet). State lives in var/PROTOTYPE-wipe-me.json.

declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../lib.php';

$root = dirname(__DIR__);
$types = [
    'ldap' => ['ldap/Ldap', 'ldap:Ldap'],
    'sql' => ['sqlauth/SQL2', 'sqlauth:SQL2'],
    'userpass' => ['exampleauth/UserPass', 'exampleauth:UserPass'],
];
$variants = [
    'A' => 'One page, no JavaScript',
    'B' => 'Dense tables, no JavaScript',
    'C' => 'Sidebar, inline script',
];
$type = isset($types[$_GET['type'] ?? '']) ? $_GET['type'] : 'ldap';
$variant = isset($variants[$_GET['variant'] ?? '']) ? $_GET['variant'] : 'A';
$self = '?' . http_build_query(['type' => $type, 'variant' => $variant]);

$storeFile = $root . '/var/PROTOTYPE-wipe-me.json';
if (isset($_GET['reset'])) {
    @unlink($storeFile);
    header('Location: ' . $self);
    exit;
}
$store = is_file($storeFile) ? json_decode(file_get_contents($storeFile)) : new stdClass();
$stored = $store->$type ?? json_decode(file_get_contents("$root/fixtures/$type.json"));
$schema = json_decode(file_get_contents("$root/schemas/{$types[$type][0]}.json"));

$errors = [];
$bound = null;
$action = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = normalise($schema, $_POST['doc'] ?? []);
    $action = $_POST['__action'] ?? 'save';
    if ($action === 'save') {
        $bound = bind($schema, $raw, $stored);
        $bound = $bound instanceof Absent ? new stdClass() : $bound;
        $errors = validateDocument($type, $schema, $bound);
        if ($errors === []) {
            $store->$type = $bound;
            file_put_contents($storeFile, json_encode($store, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
            header('Location: ' . $self . '&saved=1');
            exit;
        }
    } elseif ($action !== 'refresh') {
        applyAction($raw, $action);
    }
} else {
    $raw = toRaw($schema, $stored);
}

$tree = view($schema, $raw, $stored, 'doc', '', $errors);
$byKey = array_column($tree['children'], null, 'key');
$groups = [];
foreach ($schema->{'x-groups'} as $i => $g) {
    $fields = array_values(array_intersect_key($byKey, array_flip($g->properties)));
    usort($fields, fn ($a, $b) => array_search($a['key'], $g->properties) <=> array_search($b['key'], $g->properties));
    $groups[] = [
        'id' => 'g' . ($i + 1),
        'title' => $g->title,
        'fields' => $fields,
        'errorCount' => array_sum(array_column($fields, 'errorCount')),
    ];
}

$flat = [];
foreach ($errors as $ptr => $list) {
    foreach ($list as $msg) {
        $flat[] = ['pointer' => $ptr, 'id' => 'f' . preg_replace('/[^A-Za-z0-9]+/', '-', $ptr), 'message' => $msg];
    }
}

$json = fn ($v) => json_encode($v, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
$keys = array_keys($variants);
$pos = array_search($variant, $keys, true);
$twig = new Twig\Environment(new Twig\Loader\FilesystemLoader($root . '/templates'));
echo $twig->render("variant_" . strtolower($variant) . '.twig', [
    'title' => $schema->title,
    'types' => array_map(fn ($t) => $t[1], $types),
    'type' => $type,
    'variant' => $variant,
    'variantName' => $variants[$variant],
    'prev' => $keys[($pos + count($keys) - 1) % count($keys)],
    'next' => $keys[($pos + 1) % count($keys)],
    'self' => $self,
    'groups' => $groups,
    'rootErrors' => $errors[''] ?? [],
    'errorList' => $flat,
    'saved' => isset($_GET['saved']),
    'state' => [
        'action' => $action,
        'stored' => $json($stored),
        'bound' => $bound === null ? null : $json($bound),
        'errors' => $errors === [] ? null : $json($errors),
    ],
]);
