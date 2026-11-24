<?php

return [
    'ldap:Ldap',
    'connection_string' => 'ldaps://ldap1.example.org ldaps://ldap2.example.org',
    'timeout' => 5,
    'search.enable' => true,
    'search.base' => [
        'ou=people,dc=example,dc=org',
    ],
    'search.attributes' => [
        'uid',
        'mail',
    ],
    'search.username' => 'cn=reader,dc=example,dc=org',
    'search.password' => 'example-password',
    'attributes' => [
        'uid',
        'mail',
        'cn',
        'jpegPhoto',
    ],
    'attributes.binary' => [
        'jpegPhoto',
    ],
    'remember.username.enabled' => true,
];
