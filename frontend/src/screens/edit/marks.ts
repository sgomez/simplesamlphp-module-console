import type { EditedEntity, EntityError, EntityNotice, EntityWarning, Refusal } from '../../api/types';
import type { LineMark } from '../../components/ui/Editor';

export interface Mark {
  kind: LineMark;
  line: number | null;
  option: string | null;
  message: string;
}

function ofError({ pointer, message, line, column }: EntityError): Mark {
  return {
    kind: 'err',
    line,
    option: pointer.split('/')[1] || null,
    message: column === null ? message : `Column ${column}: ${message}`,
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

export function entityMarks(entity: EditedEntity): Mark[] {
  return marksOf({ errors: [], notices: entity.notices, warnings: entity.warnings, readable: true });
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
