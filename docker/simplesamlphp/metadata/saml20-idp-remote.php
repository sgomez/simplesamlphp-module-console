<?php

// The hosted IdP as the SP sees it.
$pem = (string) file_get_contents('/var/simplesamlphp/cert/server.crt');
$certData = preg_replace('/-----[A-Z ]+-----|\s+/', '', $pem);

$metadata['http://localhost:8080/simplesaml/saml2/idp/metadata.php'] = [
    'SingleSignOnService' => [[
        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        'Location' => 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php',
    ]],
    'SingleLogoutService' => [[
        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        'Location' => 'http://localhost:8080/simplesaml/saml2/idp/SingleLogoutService.php',
    ]],
    'certData' => $certData,
];
