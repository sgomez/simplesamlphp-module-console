import type { DiffLine } from '../../design-system/Diff';
import type { EntitySet } from '../entities';

export type PastedFormat = 'xml' | 'php';

// What a new object is read into: an entity of a set, or an authsource.
export type Target = { kind: 'entity'; set: EntitySet } | { kind: 'authsource' };

export type Collision = 'override' | 'shadowed';

export interface Noted {
  option: string;
  note: string;
}

// SPEC 9.6: what reading did to each option. What needs the administrator is an error or a warning.
export interface PastedReport {
  needs: (Noted & { severity: 'error' | 'warning' })[];
  understood: string[];
  converted: Noted[];
  extra: Noted[];
  ignored: Noted[];
}

// One object read from pasted configuration, unsaved; id is an entity ID or an authsource ID.
export interface PastedObject {
  id: string;
  name: string | null;
  php: string;
  report: PastedReport;
}

export interface Candidate {
  entityId: string;
  name: string | null;
  // Already a managed entity of the set: it cannot be picked.
  managed: boolean;
  collision: Collision | null;
}

export interface ReadProblem {
  line: number | null;
  message: string;
}

// SPEC 9.7: the stored entity with every option the XML yields for the set overwritten.
export interface Replacement {
  entityId: string;
  name: string | null;
  version: number;
  php: string;
  removed: number;
  diff: DiffLine[];
}

export type Reading =
  | { kind: 'one'; object: PastedObject }
  | { kind: 'several'; candidates: Candidate[] }
  | { kind: 'other-set'; set: EntitySet; entityId: string }
  | { kind: 'unreadable'; problems: ReadProblem[] }
  | { kind: 'mismatch'; entityId: string }
  | { kind: 'replaced'; replacement: Replacement };

export interface Created {
  entityId: string;
  name: string | null;
  collision: Collision | null;
}

// SPEC 9.5: the report of an Import, and of several entities created from pasted configuration.
export interface CreationReport {
  set: EntitySet;
  created: Created[];
  skipped: { entityId: string; name: string | null; reason: string }[];
  converted: Noted[];
  // Per source, the entity IDs the administrator may now remove from the original by hand.
  removable: { location: string; entityIds: string[] }[];
  // Sources before console:Snapshot: what was imported from them is Shadowed.
  shadowing: string[];
  pending: number;
}
