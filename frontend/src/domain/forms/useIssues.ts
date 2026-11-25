import { useMemo } from 'react';
import { validate, type DocumentSet } from '../documents';
import type { Doc } from './engine/document';
import type { Issue } from './engine/issues';

// Every change is checked against the compiled schema at once; the server's findings join them, each once.
export function useIssues(set: DocumentSet, doc: Doc, server: readonly Issue[]): Issue[] {
  const schema = useMemo(() => validate(set, doc), [set, doc]);

  return useMemo(() => {
    const seen = new Set<string>();

    return [...schema.map((error) => ({ ...error, kind: 'error' as const })), ...server].filter(({ pointer, message, kind }) => {
      const key = `${kind}\n${pointer}\n${message}`;
      const fresh = !seen.has(key);
      seen.add(key);

      return fresh;
    });
  }, [schema, server]);
}
