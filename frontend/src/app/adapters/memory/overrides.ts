import type { OverrideComparison, OverridesPort } from '../../../domain/overrides';
import type { Failed } from '../../../lib/result';

const ACS = 'catalogue.library.example.edu/Shibboleth.sso/SAML2/POST';

// The Compare board.
export const boardComparison: OverrideComparison = {
  entityId: 'https://catalogue.library.example.edu/shibboleth',
  name: 'Library catalogue',
  changedOn: '2026-11-21T08:30:00',
  options: [
    { option: 'AssertionConsumerService', managed: `https://${ACS}`, source: `http://${ACS}`, changedInSource: false },
    { option: 'attributes', managed: 'uid, mail', source: 'uid, mail, eduPersonAffiliation', changedInSource: true },
    { option: 'validate.authnrequest', managed: 'true', source: null, changedInSource: false },
    { option: 'NameIDFormat', managed: 'persistent', source: 'persistent', changedInSource: false },
    { option: 'certData', managed: 'MIIDQjCC… 9F:2A', source: 'MIIDQjCC… 9F:2A', changedInSource: false },
    { option: 'name', managed: 'en: Library catalogue', source: 'en: Library catalogue', changedInSource: false },
  ],
};

export interface MemoryOverrides {
  comparison?: OverrideComparison;
  failure?: Failed;
  // What Mark as reviewed answers in place of success; 'pending' never answers.
  review?: Failed | 'pending';
}

export function memoryOverrides({ comparison = boardComparison, failure, review }: MemoryOverrides = {}): OverridesPort {
  return {
    compare: async () => (failure ? { ok: false, ...failure } : { ok: true, data: comparison }),
    markReviewed: async () => {
      if (review === 'pending') {
        return new Promise(() => undefined);
      }

      return review ? { ok: false, ...review } : { ok: true, data: {} };
    },
  };
}
