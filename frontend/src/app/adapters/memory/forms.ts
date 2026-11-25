import type { CertificateFacts, Doc, FormCapabilities, Issue } from '../../../domain/forms';

const POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';
const REDIRECT = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';
const MOODLE_SP = 'https://moodle.example.edu/auth/saml2/sp';

export const MOODLE_PEM = '-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAL3fMoodle\n-----END CERTIFICATE-----';

const CERTIFICATES: Record<string, CertificateFacts> = {
  [MOODLE_PEM]: { subject: 'CN=moodle.example.edu', expires: '2026-12-06T00:00:00Z', days: 12 },
};

export const formCapabilities: FormCapabilities = {
  reveal: true,
  authsources: ['university-ldap', 'guest-sql', 'default-sp'],
  secrets: ['sp-key-pass', 'ldap-bind'],
  describe: (pem) => CERTIFICATES[pem.trim()] ?? null,
};

// FormServiceProvider: Moodle as stored, and with one attribute added since.
export const moodleSaved: Doc = {
  name: { en: 'Moodle', es: 'Campus virtual' },
  AssertionConsumerService: [{ Binding: POST, Location: `${MOODLE_SP}/saml2-acs.php` }],
  SingleLogoutService: [{ Binding: REDIRECT, Location: `${MOODLE_SP}/saml2-logout.php` }],
  NameIDFormat: ['urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'],
  attributes: [{ name: 'uid' }, { name: 'mail' }, { name: 'displayName' }],
  'attributes.NameFormat': 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',
  certificates: [{ pem: MOODLE_PEM, use: 'both' }],
  'validate.authnrequest': true,
  'assertion.encryption': false,
};

export const moodleEdited: Doc = {
  ...moodleSaved,
  attributes: [{ name: 'uid' }, { name: 'mail' }, { name: 'displayName' }, { name: 'eduPersonAffiliation' }],
};

// Form: the default-sp authsource after a rejected save.
export const defaultSp: Doc = {
  entityID: 'https://login.example.edu/sp',
  discoURL: 'disco.example.edu/ds',
  ForceAuthn: false,
  AuthnContextClassRef: ['https://refeds.org/profile/mfa'],
  'sign.authnrequest': true,
  'signature.algorithm': 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',
  key: { privatekey: 'default-sp.pem', privatekey_pass: '%env(CONSOLE_SP_KEY_PASS)%', certificate: { source: 'file', file: 'default-sp.crt' } },
  attributes: [{ name: 'eduPersonPrincipalName' }, { name: 'mail' }, { name: 'displayName' }],
  name: { en: 'Example University login' },
  contacts: [
    { contactType: 'technical', emailAddress: ['iam@example.edu'] },
    { contactType: 'support' },
  ],
};

export const defaultSpIssues: Issue[] = [
  { pointer: '/discoURL', message: 'Enter the full URL, starting with https://', kind: 'error' },
  { pointer: '/contacts/1', message: 'The support contact has no email address.', kind: 'error' },
  { pointer: '/signature.algorithm', message: 'Many identity providers reject SHA-1.', kind: 'warning' },
];

// FormMultiAuth.
export const staffOrGuest: Doc = {
  sources: [{ source: 'university-ldap' }, { source: 'guest-sql' }],
  preselect: 'university-ldap',
};

// A hosted IdP that signs its metadata, with a stored passphrase.
export const hostedIdp: Doc = {
  host: 'idp.example.org',
  auth: 'university-ldap',
  key: { privatekey: 'idp.key', privatekey_pass: 'correct horse', certificate: { source: 'pasted', pem: MOODLE_PEM } },
  'metadata.sign.enable': true,
};
