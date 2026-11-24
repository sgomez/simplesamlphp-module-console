<?php

$config = [
    'admin' => ['core:AdminPassword'],

    'default-sp' => [
        'saml:SP',
        'entityID' => 'http://localhost:8080/simplesaml/module.php/saml/sp/metadata.php/default-sp',
        'idp' => 'http://localhost:8080/simplesaml/saml2/idp/metadata.php',
    ],

    'example-userpass' => [
        'exampleauth:UserPass',
        'student:studentpass' => [
            'uid' => ['student'],
            'eduPersonAffiliation' => ['member', 'student'],
        ],
        'employee:employeepass' => [
            'uid' => ['employee'],
            'eduPersonAffiliation' => ['member', 'employee'],
        ],
    ],
];
