<?php

$metadata['https://sp.example.org/description'] = [
    'AssertionConsumerService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'Location' => 'https://sp.example.org/acs',
        ],
    ],
    'keys' => [
        [
            'type' => 'X509Certificate',
            'signing' => true,
            'encryption' => false,
            'X509Certificate' => '@B64@',
        ],
        [
            'type' => 'X509Certificate',
            'signing' => false,
            'encryption' => true,
            'X509Certificate' => '@B64@',
        ],
    ],
    'name' => [
        'en' => 'Example service',
        'es' => 'Servicio de ejemplo',
    ],
    'description' => [
        'en' => 'A service used in tests',
    ],
    'OrganizationName' => [
        'en' => 'Example organisation',
    ],
    'OrganizationDisplayName' => [
        'en' => 'Example',
    ],
    'OrganizationURL' => [
        'en' => 'https://example.org',
    ],
    'UIInfo' => [
        'DisplayName' => [
            'en' => 'Example service',
        ],
        'Keywords' => [
            'en' => [
                'example',
                'test',
            ],
        ],
        'Logo' => [
            [
                'url' => 'https://sp.example.org/logo.png',
                'width' => 80,
                'height' => 60,
            ],
        ],
    ],
    'contacts' => [
        [
            'contactType' => 'technical',
            'givenName' => 'Support',
            'emailAddress' => [
                'mailto:support@example.org',
            ],
            'telephoneNumber' => [
                '+34000000000',
            ],
            'attributes' => [
                'example:attr' => '1',
            ],
        ],
    ],
    'EntityAttributes' => [
        'http://macedir.org/entity-category' => [
            'http://refeds.org/category/research-and-scholarship',
        ],
    ],
    'RegistrationInfo' => [
        'authority' => 'https://registrar.example.org',
        'instant' => 1795515300,
        'policies' => [
            'en' => 'https://registrar.example.org/policy',
        ],
    ],
    'scope' => [
        'example.org',
    ],
    'hide.from.discovery' => true,
    'consent.disable' => true,
];
