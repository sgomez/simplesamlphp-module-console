<?php

$metadata['https://idp.example.org/idp'] = [
    'host' => 'idp.example.org',
    'auth' => 'campus-ldap',
    'privatekey' => '/run/secrets/idp.key',
    'privatekey_pass' => 'resolved-on-the-node',
    'certificate' => '/run/secrets/idp.crt',
    'new_privatekey' => 'idp-2027.key',
    'new_certData' => 'MIIBijCCAS+gAwIBAgIUBOipfhs3LtI/6gAma+kwyjvO3UswCgYIKoZIzj0EAwIwGjEYMBYGA1UEAwwPaWRwLmV4YW1wbGUubmV0MB4XDTI2MTEyNDE3MjIxNloXDTM2MTEyMTE3MjIxNlowGjEYMBYGA1UEAwwPaWRwLmV4YW1wbGUubmV0MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAENSMNu5VqhChygJaGT7MxzfZXedEjZOrCAvNCMqXUzCGt1YCOHNOHGUo2+r+ciR2Mx8Mx+fvB2U4jIwBcCy7M1aNTMFEwHQYDVR0OBBYEFCWZtS+7Lw8ibLBhwxSVjmlqNxt4MB8GA1UdIwQYMBaAFCWZtS+7Lw8ibLBhwxSVjmlqNxt4MA8GA1UdEwEB/wQFMAMBAf8wCgYIKoZIzj0EAwIDSQAwRgIhAImZAhgfl3R8Er9p+btTwMYVw/SkDq0cBIf6Hn/aMQyBAiEAq+KQ94GUUGBNcXQ68epD6iWNfbjVJYKTRQqzZAvb9rw=',
    'SingleSignOnServiceBinding' => [
        'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
    ],
    'SingleLogoutService' => 'https://idp.example.org/simplesaml/module.php/saml/idp/singleLogout',
    'SingleLogoutServiceBinding' => [
        'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
    ],
    'attributes.NameFormat' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',
    'NameIDFormat' => [
        'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
        'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
    ],
    'validate.authnrequest' => false,
    'OrganizationName' => [
        'en' => 'Example University',
    ],
    'OrganizationURL' => [
        'en' => 'https://www.example.org',
    ],
    'contacts' => [
        [
            'contactType' => 'support',
            'company' => 'Example University',
            'emailAddress' => [
                'mailto:helpdesk@example.org',
            ],
            'telephoneNumber' => [
                '+34 900 000 000',
            ],
        ],
    ],
    'scope' => [
        'example.org',
    ],
    'RegistrationInfo' => [
        'authority' => 'https://federation.example.org',
        'instant' => '2026-01-15T09:00:00Z',
    ],
    'metadata.sign.enable' => true,
    'metadata.sign.algorithm' => 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
    'authproc' => [
        30 => [
            'class' => 'core:TargetedID',
            'identifyingAttribute' => 'uid',
        ],
        90 => [
            'class' => 'core:AttributeMap',
            'name2oid',
        ],
    ],
];
