<?php

// The local SP, as a flat file. The Console takes it over once published (SPEC.md section 12.7).
$metadata['http://localhost:8080/simplesaml/module.php/saml/sp/metadata.php/default-sp'] = [
    'AssertionConsumerService' => [[
        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        'Location' => 'http://localhost:8080/simplesaml/module.php/saml/sp/saml2-acs.php/default-sp',
        'index' => 0,
    ]],
    'SingleLogoutService' => [[
        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        'Location' => 'http://localhost:8080/simplesaml/module.php/saml/sp/saml2-logout.php/default-sp',
    ]],
];
