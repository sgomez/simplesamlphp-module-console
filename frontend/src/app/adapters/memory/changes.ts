import type { DiffLine } from '../../../design-system/Diff';
import type { ChangeGroup, NodeStatus, PendingChange } from '../../../domain/publication';

const same = (text: string): DiffLine => ({ kind: 'same', text });
const add = (text: string): DiffLine => ({ kind: 'add', text });
const del = (text: string): DiffLine => ({ kind: 'del', text });

function change(entityId: string, name: string, summary: string, diff: DiffLine[], more: Partial<PendingChange> = {}): PendingChange {
  return { entityId, name, loadError: null, opens: true, kind: 'Service provider', summary, diff, ...more };
}

// The Publish board's seven changes.
export const boardGroups: ChangeGroup[] = [
  {
    state: 'Modified',
    changes: [
      change('https://catalogue.library.example.edu/shibboleth', 'Library catalogue', '2 options', [
        same("'AssertionConsumerService' => ["),
        same('    ['),
        same("        'Binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',"),
        del("        'Location' => 'http://catalogue.library.example.edu/Shibboleth.sso/SAML2/POST',"),
        add("        'Location' => 'https://catalogue.library.example.edu/Shibboleth.sso/SAML2/POST',"),
        same('    ],'),
        same('],'),
        add("'validate.authnrequest' => true,"),
      ]),
      change(
        'default-sp',
        'default-sp',
        '1 option, 1 secret',
        [
          del("'signature.algorithm' => 'http://www.w3.org/2000/09/xmldsig#rsa-sha1',"),
          add("'signature.algorithm' => 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',"),
          { kind: 'sec', text: "'privatekey_pass'  secret changed, value not shown" },
        ],
        { kind: 'Authsource · saml:SP' },
      ),
      change('https://moodle.example.edu/shibboleth', 'Moodle', '1 option', [
        same("'attributes' => ['uid', 'mail', 'displayName',"),
        add("    'eduPersonAffiliation',"),
        same('],'),
      ]),
    ],
  },
  {
    state: 'Unpublished',
    changes: [
      change('https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21', 'Travel booking', 'New, 9 options', [
        add("'entityid' => 'https://sso.travelbooker.example.com/saml2/metadata/7f3a9c21',"),
        add("'name' => ['en' => 'Travel booking'],"),
        add('… 7 more options'),
      ]),
      change(
        'https://idp.hospital.example.org/idp/shibboleth',
        'Partner hospital',
        'New, 6 options',
        [add("'entityid' => 'https://idp.hospital.example.org/idp/shibboleth',"), add('… 5 more options')],
        { kind: 'Identity provider' },
      ),
    ],
  },
  {
    state: 'To be withdrawn',
    changes: [
      change('https://intranet-old.example.edu/simplesaml/module.php/saml/sp/metadata.php/default-sp', 'Old intranet', 'Disabled', [
        del("'entityid' => 'https://intranet-old.example.edu/simplesaml/module.php/saml/sp/metadata.php/default-sp',"),
        del('… 11 more options, kept in the Console'),
      ]),
    ],
  },
  {
    state: 'Deleted',
    changes: [
      change('legacy-radius', 'legacy-radius', 'Removed everywhere', [del("'legacy-radius' => ['sqlauth:SQL2', … 6 options],")], {
        kind: 'Authsource · sqlauth:SQL2',
        opens: false,
      }),
    ],
  },
];

// The rows as the PublishBlocked and PublishMoved boards show them: summaries, no diff.
export const flatGroups: ChangeGroup[] = boardGroups.map(({ state, changes }) => ({
  state,
  changes: changes.map((change) => {
    const flat = { ...change };
    delete flat.diff;

    return flat;
  }),
}));

// The PublishDone board's nodes.
export const boardNodes: NodeStatus[] = [
  { id: 'web-01', here: true, serves: 42, checked: '8 s ago' },
  { id: 'web-02', here: false, serves: 42, checked: '3 s ago' },
  { id: 'web-03', here: false, serves: 41, checked: 'checks every 60 s' },
];
