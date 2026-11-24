<?php

return [
    'multiauth:MultiAuth',
    'sources' => [
        'staff-ldap' => [
            'text' => [
                'en' => 'Staff',
                'es' => 'Personal',
            ],
            'css_class' => 'staff',
        ],
        'guests' => [],
    ],
    'preselect' => 'staff-ldap',
];
