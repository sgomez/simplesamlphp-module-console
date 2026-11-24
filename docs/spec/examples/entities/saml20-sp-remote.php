<?php

$metadata['https://sp.example.net/shibboleth'] = [
    'AssertionConsumerService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'Location' => 'https://sp.example.net/Shibboleth.sso/SAML2/POST',
            'index' => 1,
            'isDefault' => true,
        ],
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact',
            'Location' => 'https://sp.example.net/Shibboleth.sso/SAML2/Artifact',
            'index' => 2,
        ],
    ],
    'SingleLogoutService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            'Location' => 'https://sp.example.net/Shibboleth.sso/SLO/Redirect',
        ],
    ],
    'keys' => [
        [
            'type' => 'X509Certificate',
            'signing' => true,
            'encryption' => true,
            'X509Certificate' => 'MIIBhzCCAS2gAwIBAgIUMYEkNMi2NmvWJcijz7C1Wzf7h54wCgYIKoZIzj0EAwIwGTEXMBUGA1UEAwwOc3AuZXhhbXBsZS5uZXQwHhcNMjYxMTI0MTcyMjE2WhcNMzYxMTIxMTcyMjE2WjAZMRcwFQYDVQQDDA5zcC5leGFtcGxlLm5ldDBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABL5aDkN3KKoUJchTdDxewZnowahYEtAuvn4AfbuJkb0BMfrtUMNHH/Y26bDjzG7jchaiITeVgFXXRTUi5GioQlmjUzBRMB0GA1UdDgQWBBS9IItIMsk7y1gj8HMyVd4Cp+2GnjAfBgNVHSMEGDAWgBS9IItIMsk7y1gj8HMyVd4Cp+2GnjAPBgNVHRMBAf8EBTADAQH/MAoGCCqGSM49BAMCA0gAMEUCIGu2NI6cNouLy5AiMpn/sPyJkcy5k8DPVxxEiEl3OesAAiEAz3wRjEQ1803SAamlbJi/PUcrLeiDFXKk3jf+vjPF13Y=',
        ],
    ],
    'name' => [
        'en' => 'Example library',
        'es' => 'Biblioteca de ejemplo',
    ],
    'OrganizationName' => [
        'en' => 'Example Library Services',
    ],
    'UIInfo' => [
        'DisplayName' => [
            'en' => 'Example library',
        ],
        'Logo' => [
            [
                'url' => 'https://sp.example.net/logo.png',
                'width' => 80,
                'height' => 60,
            ],
        ],
    ],
    'contacts' => [
        [
            'contactType' => 'technical',
            'givenName' => 'Library systems',
            'emailAddress' => [
                'mailto:systems@example.net',
            ],
        ],
    ],
    'EntityAttributes' => [
        'http://macedir.org/entity-category' => [
            'http://refeds.org/category/research-and-scholarship',
        ],
    ],
    'attributes' => [
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.6',
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.7' => [
            'urn:mace:dir:entitlement:common-lib-terms',
        ],
    ],
    'attributes.required' => [
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.6',
    ],
    'attributes.NameFormat' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',
    'attributeencodings' => [
        'urn:oid:1.3.6.1.4.1.5923.1.1.1.10' => 'raw',
    ],
    'NameIDFormat' => [
        'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    ],
    'validate.authnrequest' => true,
    'assertion.encryption' => true,
    'authproc' => [
        60 => [
            'class' => 'core:AttributeLimit',
        ],
    ],
    'consent.disable' => true,
];
