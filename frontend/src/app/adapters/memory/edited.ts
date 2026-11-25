import type { EditedEntity, EntityError, Refusal } from '../../../domain/entities';

export const MOODLE = 'https://moodle.example.edu/auth/saml2/sp/metadata.php';

const POST = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST';
const REDIRECT = 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect';

// The PHP of the FormServiceProvider board's Moodle, with `acs` and `extra` lines to vary.
export function moodlePhp({ acs = 'https://moodle.example.edu/auth/saml2/sp/saml2-acs.php', extra = '' } = {}): string {
  return [
    `$metadata['${MOODLE}'] = [`,
    "    'name' => [",
    "        'en' => 'Moodle',",
    "        'es' => 'Campus virtual',",
    '    ],',
    "    'AssertionConsumerService' => [",
    '        [',
    `            'Binding' => '${POST}',`,
    `            'Location' => '${acs}',`,
    '        ],',
    '    ],',
    "    'SingleLogoutService' => [",
    '        [',
    `            'Binding' => '${REDIRECT}',`,
    "            'Location' => 'https://moodle.example.edu/auth/saml2/sp/saml2-logout.php',",
    '        ],',
    '    ],',
    "    'NameIDFormat' => 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent',",
    "    'attributes' => ['uid', 'mail', 'displayName'],",
    "    'attributes.NameFormat' => 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri',",
    "    'signature.algorithm' => 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',",
    "    'validate.authnrequest' => true,",
    ...(extra === '' ? [] : [extra]),
    "    'assertion.encryption' => false,",
    '];',
  ].join('\n');
}

export function edited(more: Partial<EditedEntity> = {}): EditedEntity {
  return {
    entityId: MOODLE,
    name: 'Moodle',
    version: 4,
    state: 'Modified',
    unreadable: false,
    error: null,
    php: moodlePhp(),
    raw: null,
    errors: [],
    warnings: [],
    notices: [],
    enabled: true,
    inSnapshot: true,
    ...more,
  };
}

function error(pointer: string, message: string, line: number, column: number | null = null): EntityError {
  return { pointer, message, line, column };
}

// FormPhp: two errors and a warning, on the lines they come from.
export const formPhpRefusal: Refusal = {
  readable: true,
  errors: [
    error('/AssertionConsumerService/0/Location', 'Enter the full URL, starting with https://', 9),
    error('/attributes.NameFormat', 'Enter a URI.', 20),
  ],
  notices: [{ message: 'Many identity providers reject SHA-1.', option: 'signature.algorithm', line: 21 }],
};

export const formPhpText = moodlePhp({ acs: 'moodle.example.edu/auth/saml2/sp/saml2-acs.php' });

// PhpSyntax: the text could not be read.
export const syntaxRefusal: Refusal = {
  readable: false,
  errors: [error('', 'a comma is missing at the end of line 8.', 9, 5)],
  notices: [],
};

export const syntaxText = moodlePhp().replace(`${POST}',`, `${POST}'`);

// PhpSaved: an unknown option kept, with the option it is close to.
export const savedPhp = moodlePhp({ extra: "    'sing.logout' => true," });

export const unknownOption = { message: 'is not a known option.', option: 'sing.logout', line: 23, suggestion: 'sign.logout' };

export const unreadable = edited({
  name: null,
  state: 'Modified',
  unreadable: true,
  php: null,
  error: 'The stored document is not valid JSON.',
  raw: '{"entityid": "https://moodle.example.edu/auth/saml2/sp/metadata.php", "name": {"en": "Moodle"\n',
});
