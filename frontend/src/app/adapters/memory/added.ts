import type { EditedEntity } from '../../../domain/entities';

const TRAVELBOOKER = 'https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21';
const POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';
const PERSISTENT = 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent';

// The metadata the AddEntity board pastes.
export const boardXml = [
  '<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata"',
  `    entityID="${TRAVELBOOKER}"`,
  '    validUntil="2027-01-31T00:00:00Z">',
  '  <md:SPSSODescriptor AuthnRequestsSigned="true"',
  '      protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">',
  '    <md:KeyDescriptor use="signing">',
  '      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">',
  '        <ds:X509Data><ds:X509Certificate>MIIDXTCCAkWgAwIBAgIJAL3f…</ds:X509Certificate></ds:X509Data>',
  '      </ds:KeyInfo>',
  '    </md:KeyDescriptor>',
  `    <md:NameIDFormat>${PERSISTENT}</md:NameIDFormat>`,
  '    <md:AssertionConsumerService index="0"',
  `        Binding="${POST}"`,
  '        Location="https://sso.travelbooker.example.com/saml2/acs/7f3a9c21"/>',
  '  </md:SPSSODescriptor>',
  '  <md:Organization>',
  '    <md:OrganizationName xml:lang="en">Travelbooker</md:OrganizationName>',
  '  </md:Organization>',
  '</md:EntityDescriptor>',
].join('\n');

export const boardPhp = "$metadata['https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21'] = [\n    'validate.authnrequest' => true,\n];";

function added(php: string): EditedEntity {
  return {
    entityId: '',
    name: null,
    version: 0,
    state: null,
    unreadable: false,
    error: null,
    php,
    raw: null,
    errors: [],
    warnings: [],
    notices: [],
    enabled: true,
    inSnapshot: false,
  };
}

// Draft 07: the required options only, without the entity ID.
export const starter = added("$metadata[''] = [\n    'AssertionConsumerService' => [],\n];");

export const travelbooker = added(
  [
    `$metadata['${TRAVELBOOKER}'] = [`,
    "    'name' => [",
    "        'en' => 'Travelbooker',",
    '    ],',
    "    'AssertionConsumerService' => [",
    '        [',
    `            'Binding' => '${POST}',`,
    "            'Location' => 'https://sso.travelbooker.example.com/saml2/acs/7f3a9c21',",
    "            'index' => 0,",
    '        ],',
    '    ],',
    `    'NameIDFormat' => '${PERSISTENT}',`,
    "    'validate.authnrequest' => true,",
    "    'keys' => [",
    '        [',
    "            'type' => 'X509Certificate',",
    "            'signing' => true,",
    "            'encryption' => false,",
    "            'X509Certificate' => 'MIIDXTCCAkWgAwIBAgIJAL3f…',",
    '        ],',
    '    ],',
    '];',
  ].join('\n'),
);
