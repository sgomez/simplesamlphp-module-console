import { validators, type DocumentSet } from '../generated/validators';
import { report, type SchemaError } from './messages';

export type { DocumentSet, SchemaError };

export function validate(set: DocumentSet, document: unknown): SchemaError[] {
  const check = validators[set];

  return check(document) ? [] : report(check.errors ?? []);
}
