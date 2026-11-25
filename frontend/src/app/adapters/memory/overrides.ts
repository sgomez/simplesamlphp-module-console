import type { ExternalPage, ExternalSource, OverrideComparison, OverridesPort } from '../../../domain/overrides';
import type { Failed } from '../../../lib/result';
import { boardSources, copiesOf, type SourceFixture } from './external';

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
  sources?: SourceFixture[];
  perPage?: number;
}

const PER_PAGE = 25;

function matches(q: string) {
  const needle = q.toLowerCase();

  return (row: { entityId: string; name: string | null }) => row.entityId.toLowerCase().includes(needle) || (row.name ?? '').toLowerCase().includes(needle);
}

export function memoryOverrides({ comparison = boardComparison, failure, review, sources = boardSources, perPage = PER_PAGE }: MemoryOverrides = {}): OverridesPort {
  const answer = async <T>(data: () => T) => (failure ? { ok: false as const, ...failure } : { ok: true as const, data: data() });

  return {
    external: ({ set, q, source, page }) =>
      answer((): ExternalPage => ({
        set,
        query: q,
        sources: sources.map((fixture, position): ExternalSource => {
          const rows = (fixture.sets[set] ?? []).filter(matches(q));
          const pages = Math.max(1, Math.ceil(rows.length / perPage));
          const at = source === String(position) ? Math.min(Math.max(Number(page) || 1, 1), pages) : 1;
          const { heading, location, importable, error = null } = fixture;

          return { position, heading, location, importable, error, total: rows.length, page: at, pages, perPage, rows: rows.slice((at - 1) * perPage, at * perPage) };
        }),
      })),
    externalEntity: async (set, entityId) => {
      const { name, copies } = copiesOf(sources, set, entityId);
      if (copies.length === 0) {
        return { ok: false, status: 404, body: null };
      }

      return answer(() => ({ set, entityId, name, copies }));
    },
    compare: () => answer(() => comparison),
    markReviewed: async () => {
      if (review === 'pending') {
        return new Promise(() => undefined);
      }

      return review ? { ok: false, ...review } : { ok: true, data: {} };
    },
  };
}
