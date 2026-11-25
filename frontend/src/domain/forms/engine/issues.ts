import type { FormNode } from '../../documents';
import { pointerOf } from './document';
import type { GroupView } from './presence';

export interface Issue {
  pointer: string;
  message: string;
  kind: 'error' | 'warning';
}

export function within(issues: readonly Issue[], pointer: string): Issue[] {
  return issues.filter((issue) => issue.pointer === pointer || issue.pointer.startsWith(`${pointer}/`));
}

export function at(issues: readonly Issue[], pointer: string): Issue[] {
  return issues.filter((issue) => issue.pointer === pointer);
}

export function errorCount(issues: readonly Issue[]): number {
  return issues.filter(({ kind }) => kind === 'error').length;
}

// The errors of a group: those of its rendered options.
export function groupErrors(group: GroupView, issues: readonly Issue[]): number {
  return group.options.reduce((sum, { name }) => sum + errorCount(within(issues, pointerOf('', name))), 0);
}

const SECRET = /^%(secret\([^/()]+\)|env\(CONSOLE_[A-Za-z0-9_]+\))%$/;

export function isSecretReference(value: unknown): boolean {
  return typeof value === 'string' && SECRET.test(value);
}

// SPEC 7.2: a string without an enum and without x-literal.
export function acceptsSecret(node: FormNode): boolean {
  return node.type === 'string' && node.enum === undefined && node.literal !== true;
}

const shown = (value: unknown) => (typeof value === 'string' ? value : JSON.stringify(value));

// The hint under an option: its default, or else its first example.
export function hintOf(node: FormNode): { label: 'Default' | 'Example'; value: string } | null {
  if (node.default !== undefined) {
    return { label: 'Default', value: shown(node.default) };
  }
  const [example] = node.examples ?? [];

  return example === undefined ? null : { label: 'Example', value: shown(example) };
}
