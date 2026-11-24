<?php

declare(strict_types=1);

namespace SimpleSAML\Module\console\Domain\Php;

final class Saml2Constants
{
    public const string CLASS_NAME = 'SAML2\\Constants';


    public static function value(string $name): ?string
    {
        return self::table()[$name] ?? null;
    }


    /**
     * @return array<string, string>
     */
    private static function table(): array
    {
        return [
            'BINDING_HTTP_POST' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
            'BINDING_HTTP_REDIRECT' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            'BINDING_HTTP_ARTIFACT' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Artifact',
            'BINDING_SOAP' => 'urn:oasis:names:tc:SAML:2.0:bindings:SOAP',
            'BINDING_PAOS' => 'urn:oasis:names:tc:SAML:2.0:bindings:PAOS',
            'BINDING_HOK_SSO' => 'urn:oasis:names:tc:SAML:2.0:profiles:holder-of-key:SSO:browser',
            'NAMEFORMAT_UNSPECIFIED' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:unspecified',
            'NAMEFORMAT_URI' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',
            'NAMEFORMAT_BASIC' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
            'NAMEID_UNSPECIFIED' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified',
            'NAMEID_EMAIL_ADDRESS' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
            'NAMEID_X509_SUBJECT_NAME' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:X509SubjectName',
            'NAMEID_KERBEROS' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:kerberos',
            'NAMEID_ENTITY' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:entity',
            'NAMEID_PERSISTENT' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',
            'NAMEID_TRANSIENT' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:transient',
            'NAMEID_ENCRYPTED' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:encrypted',
        ];
    }
}
