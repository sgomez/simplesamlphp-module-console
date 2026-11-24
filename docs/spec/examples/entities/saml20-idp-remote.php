<?php

$metadata['https://idp.example.net/idp/shibboleth'] = [
    'SingleSignOnService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            'Location' => 'https://idp.example.net/idp/profile/SAML2/Redirect/SSO',
        ],
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'Location' => 'https://idp.example.net/idp/profile/SAML2/POST/SSO',
        ],
    ],
    'SingleLogoutService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            'Location' => 'https://idp.example.net/idp/profile/SAML2/Redirect/SLO',
            'ResponseLocation' => 'https://idp.example.net/idp/profile/SAML2/Redirect/SLO/Response',
        ],
    ],
    'keys' => [
        [
            'type' => 'X509Certificate',
            'signing' => true,
            'encryption' => false,
            'X509Certificate' => 'MIIBijCCAS+gAwIBAgIUBOipfhs3LtI/6gAma+kwyjvO3UswCgYIKoZIzj0EAwIwGjEYMBYGA1UEAwwPaWRwLmV4YW1wbGUubmV0MB4XDTI2MTEyNDE3MjIxNloXDTM2MTEyMTE3MjIxNlowGjEYMBYGA1UEAwwPaWRwLmV4YW1wbGUubmV0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENSMNu5VqhChygJaGT7MxzfZXedEjZOrCAvNCMqXUzCGt1YCOHNOHGUo2+r+ciR2Mx8Mx+fvB2U4jIwBcCy7M1aNTMFEwHQYDVR0OBBYEFCWZtS+7Lw8ibLBhwxSVjmlqNxt4MB8GA1UdIwQYMBaAFCWZtS+7Lw8ibLBhwxSVjmlqNxt4MA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDSQAwRgIhAImZAhgfl3R8Er9p+btTwMYVw/SkDq0cBIf6Hn/aMQyBAiEAq+KQ94GUUGBNcXQ68epD6iWNfbjVJYKTRQqzZAvb9rw=',
        ],
    ],
    'name' => [
        'en' => 'Example University',
        'es' => 'Universidad de Ejemplo',
    ],
    'UIInfo' => [
        'DisplayName' => [
            'en' => 'Example University',
        ],
    ],
    'DiscoHints' => [
        'DomainHint' => [
            'example.net',
        ],
    ],
    'hint.cidr' => [
        '192.0.2.0/24',
    ],
    'RegistrationInfo' => [
        'authority' => 'https://federation.example.org',
        'instant' => 1768467600,
    ],
    'scope' => [
        'example.net',
    ],
    'AuthnContextClassRef' => 'https://refeds.org/profile/mfa',
    'NameIDFormats' => [
        'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
        'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    ],
    'sign.authnrequest' => true,
    'sharedkey' => 'resolved-on-the-node',
    'authproc' => [
        10 => [
            'class' => 'saml:FilterScopes',
        ],
    ],
];
