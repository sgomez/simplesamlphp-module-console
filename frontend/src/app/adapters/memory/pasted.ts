import type { PastedObject, PastedPort, Reading, Target } from '../../../domain/pasted';
import type { Failed, Result } from '../../../lib/result';
import { boardSources, copiesOf } from './external';
import { hrSelfService, noReport, travelbooker } from './pastedBoards';
import { HOSPITAL, moodleReplacement, severalCandidates } from './pastedSeveral';

export interface MemoryPasted {
  // What reading answers in place of what the text gives.
  reading?: Reading;
  failure?: Failed;
}

const AUTHSOURCE: PastedObject = {
  id: 'university-ldap',
  name: null,
  php: "$config['university-ldap'] = [\n    'ldap:Ldap',\n    'hostname' => 'ldaps://ldap.example.edu',\n];",
  report: { ...noReport, understood: ['0', 'hostname'] },
};

// The boards' readings, told apart by what the text holds.
export function boardReading(target: Target, text: string, entityId?: string): Reading {
  if (target.kind === 'authsource') {
    return { kind: 'one', object: AUTHSOURCE };
  }
  const line = text.split('\n').findIndex((at) => at.includes('file_get_contents('));
  if (line >= 0) {
    return { kind: 'unreadable', problems: [{ line: line + 1, message: 'file_get_contents(…) is a function call. Paste the certificate itself, as a string.' }] };
  }
  if (text.includes('IDPSSODescriptor') && target.set === 'saml20-sp-remote') {
    return { kind: 'other-set', set: 'saml20-idp-remote', entityId: HOSPITAL };
  }
  const picked = severalCandidates.find((candidate) => candidate.entityId === entityId);
  if (picked) {
    const php = `$metadata['${picked.entityId}'] = [\n    'name' => ['en' => '${picked.name ?? ''}'],\n];`;

    return { kind: 'one', object: { id: picked.entityId, name: picked.name, php, report: { ...noReport, understood: ['entityid', 'name'] } } };
  }
  if ((text.match(/\$metadata\s*\[|<(?:md:)?EntityDescriptor\b/g) ?? []).length > 1) {
    return { kind: 'several', candidates: severalCandidates };
  }
  if (text.includes('sharedkey')) {
    return { kind: 'one', object: hrSelfService };
  }

  return { kind: 'one', object: travelbooker };
}

function copyOf(set: Parameters<PastedPort['copy']>[0], entityId: string, source: number): PastedObject | null {
  const copy = copiesOf(boardSources, set, entityId).copies.find(({ position }) => position === source);

  return copy
    ? {
        id: entityId,
        name: copiesOf(boardSources, set, entityId).name,
        php: copy.php,
        report: { ...noReport, converted: [{ option: 'expire', note: 'Dropped: managed entities do not expire' }] },
      }
    : null;
}

export function memoryPasted({ reading, failure }: MemoryPasted = {}): PastedPort {
  const answer = <T>(data: T): Result<T> => (failure ? { ok: false, ...failure } : { ok: true, data });

  return {
    read: async (target, text, _format, entityId) => answer(reading ?? boardReading(target, text, entityId)),
    copy: async (set, entityId, source) => {
      const found = copyOf(set, entityId, source);

      return found ? answer(found) : { ok: false, status: 404, body: null };
    },
    createSeveral: async (set, _text, _format, entityIds) =>
      answer({
        set,
        created: severalCandidates
          .filter((candidate) => entityIds.includes(candidate.entityId))
          .map(({ entityId, name, collision }) => ({ entityId, name, collision })),
        skipped: [],
        converted: [],
        removable: [],
        shadowing: [],
        pending: 7 + entityIds.length,
      }),
    replace: async (_set, entityId, xml) =>
      answer<Reading>(
        reading ??
          (xml.includes(`entityID="${entityId}"`)
            ? { kind: 'replaced', replacement: moodleReplacement }
            : { kind: 'mismatch', entityId: /entityID="([^"]*)"/.exec(xml)?.[1] ?? '' }),
      ),
    createAuthsource: async () => answer({ id: AUTHSOURCE.id }),
  };
}
