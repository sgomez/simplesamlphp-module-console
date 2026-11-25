import type { PastedObject, PastedReport } from '../../../domain/pasted';

const TRAVELBOOKER = 'https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21';
const POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';
const PERSISTENT = 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent';

export const noReport: PastedReport = { needs: [], understood: [], converted: [], extra: [], ignored: [] };

// The metadata the AddReview board reads.
export const travelbookerXml = [
  `<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${TRAVELBOOKER}" validUntil="2027-01-31T00:00:00Z">`,
  '  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">',
  `    <md:NameIDFormat>${PERSISTENT}</md:NameIDFormat>`,
  `    <md:AssertionConsumerService index="0" Binding="${POST}" Location="https://sso.travelbooker.example.com/saml2/acs/7f3a9c21"/>`,
  '  </md:SPSSODescriptor>',
  '</md:EntityDescriptor>',
].join('\n');

// AddReview.
export const travelbooker: PastedObject = {
  id: TRAVELBOOKER,
  name: 'Travelbooker',
  php: [
    `$metadata['${TRAVELBOOKER}'] = [`,
    "    'name' => ['en' => 'Travelbooker'],",
    "    'AssertionConsumerService' => [",
    '        [',
    `            'Binding' => '${POST}',`,
    "            'Location' => 'https://sso.travelbooker.example.com/saml2/acs/7f3a9c21',",
    '        ],',
    '    ],',
    `    'NameIDFormat' => '${PERSISTENT}',`,
    "    'certData' => 'MIIDXTCCAkWgAwIBAgIJAL3f…',",
    "    'validate.authnrequest' => true,",
    "    'OrganizationName' => ['en' => 'Travelbooker'],",
    '];',
  ].join('\n'),
  report: {
    ...noReport,
    understood: ['entityid', 'AssertionConsumerService', 'NameIDFormat', 'certData', 'validate.authnrequest', 'OrganizationName'],
    converted: [
      { option: 'name', note: 'Taken from OrganizationName' },
      { option: 'certData', note: 'Line breaks removed' },
    ],
    ignored: [
      { option: 'validUntil', note: 'Managed entities do not expire' },
      { option: 'index="0"', note: 'Single endpoint' },
    ],
  },
};

const HR = 'https://hr.example.edu/sp';

// The PHP the AddUnreadable board pastes; line 5 is a function call.
export const hrPhp = [
  `$metadata['${HR}'] = [`,
  "    'name' => ['en' => 'HR self-service'],",
  "    'AssertionConsumerService' => 'https://hr.example.edu/saml/acs',",
  "    'NameIDFormat' => Constants::NAMEID_PERSISTENT,",
  "    'certData' => file_get_contents('/etc/ssl/hr.pem'),",
  "    'attributes' => ['uid', 'mail'],",
  '];',
].join('\n');

// ReviewNeeds.
export const hrSelfService: PastedObject = {
  id: HR,
  name: 'HR self-service',
  php: [
    `$metadata['${HR}'] = [`,
    "    'name' => ['en' => 'HR self-service'],",
    "    'AssertionConsumerService' => [",
    '        [',
    `            'Binding' => '${POST}',`,
    "            'Location' => 'https://hr.example.edu/saml/acs',",
    '        ],',
    '    ],',
    `    'NameIDFormat' => '${PERSISTENT}',`,
    "    'attributes' => ['uid', 'mail'],",
    "    'sharedkey' => 'k3y-in-clear-text',",
    "    'vendor.tenant' => 'example-edu',",
    '];',
  ].join('\n'),
  report: {
    needs: [
      { option: 'sharedkey', note: 'Secret in clear text. Use a Secret reference.', severity: 'warning' },
      { option: 'certData', note: 'Was a function call. Paste the certificate.', severity: 'error' },
    ],
    understood: ['entityid', 'name', 'NameIDFormat', 'attributes'],
    converted: [
      { option: 'AssertionConsumerService', note: 'One URL became an endpoint list' },
      { option: 'NameIDFormat', note: 'Constant became its value' },
    ],
    extra: [{ option: 'vendor.tenant', note: 'Not a known option' }],
    ignored: [{ option: '// comments', note: 'Comments are not kept' }],
  },
};
