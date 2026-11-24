<?php

return [
    'saml:SP',
    'entityID' => 'https://sp.example.org/metadata',
    'idp' => 'https://idp.example.org/saml2/idp/metadata.php',
    'AuthnContextClassRef' => [
        'urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport',
    ],
    'NameIDPolicy' => [
        'Format' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
        'AllowCreate' => true,
    ],
    'sign.authnrequest' => true,
    'privatekey' => '/run/secrets/sp.key',
    'privatekey_pass' => 'example-passphrase',
    'certData' => 'MIIBhzCCAS2gAwIBAgIUbASYXEZoyf9bJfhdnwHNcTJGsxcwCgYIKoZIzj0EAwIwGTEXMBUGA1UEAwwOc3AuZXhhbXBsZS5vcmcwHhcNMjYxMTI0MTY1NzM2WhcNMzYxMTIxMTY1NzM2WjAZMRcwFQYDVQQDDA5zcC5leGFtcGxlLm9yZzBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABLBtQTN3lty+NaDw6oXzjIIaaWXHZPgle44M1cY8zan7x1ahanIrxNHDnxlW8dmEWocZWmtO8laRPXv7ILNT2v+jUzBRMB0GA1UdDgQWBBTryBVfu6ZHe/PQ21Oqzv89Xdl6CDAfBgNVHSMEGDAWgBTryBVfu6ZHe/PQ21Oqzv89Xdl6CDAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIEckumiPcnaSF7iDDV6x5nM/1b2ABJJso2tIfq4YtO1RAiEA3p1GCD9WY8U9VsxBOYyjZWmPGrFCD6WP1djpl1nPNZ0=',
    'new_privatekey' => 'sp-next.key',
    'new_certificate' => 'sp-next.crt',
    'name' => [
        'en' => 'Example service',
        'es' => 'Servicio de ejemplo',
    ],
    'attributes' => [
        'mail' => 'urn:oid:0.9.2342.19200300.100.1.3',
        'urn:oid:2.5.4.3',
    ],
    'attributes.required' => [
        'urn:oid:0.9.2342.19200300.100.1.3',
    ],
    'OrganizationName' => [
        'en' => 'Example University',
    ],
    'OrganizationURL' => [
        'en' => 'https://www.example.org',
    ],
    'contacts' => [
        [
            'contactType' => 'technical',
            'givenName' => 'Service desk',
            'emailAddress' => [
                'servicedesk@example.org',
            ],
        ],
    ],
    'EntityAttributes' => [
        'http://macedir.org/entity-category' => [
            'http://refeds.org/category/research-and-scholarship',
        ],
    ],
    'authproc' => [
        50 => [
            'class' => 'core:AttributeMap',
            'oid2name',
        ],
    ],
];
