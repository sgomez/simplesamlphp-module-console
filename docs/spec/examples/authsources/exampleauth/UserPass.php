<?php

return [
    'exampleauth:UserPass',
    'users' => [
        'student:studentpass' => [
            'uid' => [
                'student',
            ],
            'eduPersonAffiliation' => [
                'member',
                'student',
            ],
        ],
        'guest:guestpass' => [],
    ],
    'core:loginpage_links' => [
        [
            'href' => 'https://example.org/help',
            'text' => 'Help',
        ],
    ],
];
