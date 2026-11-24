<?php

$metadata['https://sp.example.org/policy'] = [
    'AssertionConsumerService' => [
        [
            'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'Location' => 'https://sp.example.org/acs',
        ],
    ],
    'attributes' => [
        'uid',
        'mail' => [
            'a@example.org',
            'b@example.org',
        ],
        'cn',
    ],
    'attributesRegex' => [
        '/^eduPerson/',
    ],
    'attributes.required' => [
        'uid',
        'mail',
    ],
    'attributes.NameFormat' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
    'attributeencodings' => [
        'jpegPhoto' => 'base64',
        'objectGUID' => 'raw',
    ],
    'simplesaml.attributes' => false,
    'NameIDFormat' => [
        'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
        'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
    ],
    'nameid.encryption' => true,
    'SPNameQualifier' => 'https://sp.example.org/qualifier',
    'saml20.sign.response' => false,
    'saml20.sign.assertion' => true,
    'signature.algorithm' => 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha512',
    'sign.logout' => true,
    'redirect.sign' => true,
    'validate.authnrequest' => false,
    'validate.logout' => true,
    'redirect.validate' => true,
    'skipEndpointValidationWhenSigned' => true,
    'assertion.encryption' => true,
    'sharedkey_algorithm' => 'http://www.w3.org/2009/xmlenc11#aes256-gcm',
    'audience' => [
        'https://other.example.org',
    ],
    'ForceAuthn' => true,
    'IDPList' => [
        'https://idp.example.org',
    ],
    'ProxyCount' => 2,
    'assertion.lifetime' => 600,
    'core:statistics-id' => 'library',
    'core:logout-timeout' => 10,
    'authproc' => [
        10 => [
            'class' => 'core:AttributeMap',
            'oid2name',
        ],
        50 => [
            'class' => 'core:AttributeLimit',
            'default' => true,
        ],
    ],
];
