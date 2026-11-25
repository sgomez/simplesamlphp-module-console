import type { EditedEntity, EntityError, EntityNotice, EntityWarning, ExistingEntity, Refusal } from '../../domain/entities';
import type { LineMark } from '../../design-system/Editor';

export interface Mark {
  kind: LineMark;
  line: number | null;
  option: string | null;
  message: string;
  existing?: ExistingEntity;
}

function ofError({ pointer, message, line, column, existing }: EntityError): Mark {
  return {
    kind: 'err',
    line,
    option: pointer.split('/')[1] || null,
    message: column === null ? message : `Column ${column}: ${message}`,
    ...(existing && { existing }),
  };
}

function ofNotice({ message, option, line }: EntityNotice): Mark {
  return { kind: 'warn', line, option, message };
}

function ofWarning({ message }: EntityWarning): Mark {
  return { kind: 'warn', line: null, option: null, message };
}

// In line order; what has no line goes last.
function inOrder(marks: Mark[]): Mark[] {
  return marks.sort((a, b) => (a.line ?? Infinity) - (b.line ?? Infinity));
}

export function marksOf(result: Refusal & { warnings?: EntityWarning[] }): Mark[] {
  return inOrder([
    ...result.errors.map(ofError),
    ...result.notices.map(ofNotice),
    ...(result.warnings ?? []).map(ofWarning),
  ]);
}

function entityMarks(entity: EditedEntity): Mark[] {
  return marksOf({ errors: entity.errors, notices: entity.notices, warnings: entity.warnings, readable: true });
}

// An error outweighs a warning on the same line.
export function lineMarks(marks: readonly Mark[]): Record<number, LineMark> {
  const lines: Record<number, LineMark> = {};
  for (const { kind, line } of marks) {
    if (line !== null && lines[line] !== 'err') {
      lines[line] = kind;
    }
  }

  return lines;
}

// The marks shown belong to the text they were computed for.
interface Checked {
  text: string;
  marks: Mark[];
}

export function checkedOf(entity: EditedEntity): Checked {
  return { text: entity.php ?? '', marks: entityMarks(entity) };
}
