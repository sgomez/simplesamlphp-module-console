import type { Candidate, CreationReport, Replacement } from '../../../domain/pasted';
import { MOODLE } from './edited';

// The four entities the AddSeveral board pastes.
export const severalCandidates: Candidate[] = [
  { entityId: 'https://hr.example.edu/sp', name: 'HR self-service', managed: true, collision: null },
  { entityId: 'https://print.example.edu/saml2/service-provider-metadata/campus', name: 'Print service', managed: true, collision: null },
  { entityId: 'https://timetable.example.edu/sp', name: 'Timetable', managed: false, collision: 'override' },
  { entityId: 'https://parking.example.edu/saml/metadata', name: 'Parking permits', managed: false, collision: null },
];

export const severalPhp = severalCandidates
  .map(({ entityId, name }) => `$metadata['${entityId}'] = [\n    'name' => ['en' => '${name ?? ''}'],\n];`)
  .join('\n');

// The identity provider the AddWrongKind board pastes as a service provider.
export const HOSPITAL = 'https://idp.hospital.example.org/idp/shibboleth';

export const hospitalXml = [
  `<md:EntityDescriptor entityID="${HOSPITAL}">`,
  '  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">',
  '    …',
  '  </md:IDPSSODescriptor>',
  '</md:EntityDescriptor>',
].join('\n');

const CERT_OLD = "  'certData' => 'MIIDXTCCAkWgAwIBAgIJAL3f…',";
const CERT_NEW = "  'certData' => 'MIIDdzCCAl+gAwIBAgIEbq9…',";

// ReplaceFrom: Moodle from its new metadata.
export const moodleReplacement: Replacement = {
  entityId: MOODLE,
  name: 'Moodle',
  version: 4,
  removed: 4,
  php: [
    `$metadata['${MOODLE}'] = [`,
    "    'name' => ['en' => 'Moodle'],",
    "    'NameIDFormat' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',",
    "    'certData' => 'MIIDdzCCAl+gAwIBAgIEbq9…',",
    "    'validate.authnrequest' => true,",
    '];',
  ].join('\n'),
  diff: [
    { kind: 'same', text: "  'name' => [" },
    { kind: 'same', text: "      'en' => 'Moodle'," },
    { kind: 'del', text: "      'es' => 'Campus virtual'," },
    { kind: 'same', text: '  ],' },
    { kind: 'same', text: "  'AssertionConsumerService' => [ … ]," },
    { kind: 'del', text: "  'SingleLogoutService' => [ … ]," },
    { kind: 'same', text: "  'NameIDFormat' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'," },
    { kind: 'del', text: "  'attributes' => ['uid', 'mail', 'displayName']," },
    { kind: 'del', text: "  'attributes.NameFormat' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri'," },
    { kind: 'del', text: CERT_OLD },
    { kind: 'add', text: CERT_NEW },
    { kind: 'same', text: "  'validate.authnrequest' => true," },
    { kind: 'del', text: "  'assertion.encryption' => false," },
  ],
};

export const moodleXml = `<md:EntityDescriptor entityID="${MOODLE}">\n  <md:SPSSODescriptor>…</md:SPSSODescriptor>\n</md:EntityDescriptor>`;

// ImportResult.
export const boardImport: CreationReport = {
  set: 'saml20-sp-remote',
  created: [
    { entityId: 'https://journals.publisher.example.com/shibboleth', name: 'E-journals', collision: 'override' },
    { entityId: 'https://labs.partner.example.org/Shibboleth.sso/Metadata', name: 'Lab booking', collision: 'override' },
    { entityId: 'https://meet.vendor.example.com/saml2/sp', name: 'Video conferencing', collision: 'override' },
  ],
  skipped: [{ entityId: 'https://card.example.edu/sp', name: 'Campus card', reason: 'Already managed' }],
  converted: [
    { option: 'expire', note: 'Dropped: managed entities do not expire' },
    { option: 'certFingerprint', note: 'Kept as an extra option' },
  ],
  removable: [{ location: 'metadata/saml20-sp-remote.php', entityIds: [] }],
  shadowing: [],
  pending: 10,
};
