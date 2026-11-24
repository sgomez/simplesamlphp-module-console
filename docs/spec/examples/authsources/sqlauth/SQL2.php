<?php

return [
    'sqlauth:SQL2',
    'databases' => [
        'staff' => [
            'dsn' => 'pgsql:host=db1.example.org;dbname=staff',
            'username' => 'ssp',
            'password' => 'example-password-1',
        ],
        'students' => [
            'dsn' => 'mysql:host=db2.example.org;dbname=students',
            'username' => 'ssp',
            'password' => 'example-password-2',
        ],
    ],
    'auth_queries' => [
        'staff_login' => [
            'database' => 'staff',
            'query' => 'SELECT uid, password_hash FROM users WHERE uid = :username',
            'password_verify_hash_column' => 'password_hash',
        ],
        'student_login' => [
            'database' => 'students',
            'query' => 'SELECT uid FROM students WHERE uid = :username AND pass = SHA2(:password, 256)',
            'username_regex' => '/^a[0-9]+$/',
        ],
    ],
    'attr_queries' => [
        [
            'database' => 'staff',
            'query' => 'SELECT mail, cn FROM users WHERE uid = :username',
            'only_for_auth' => [
                'staff_login',
            ],
        ],
    ],
];
