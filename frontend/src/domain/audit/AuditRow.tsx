import { Pre } from '../../design-system/Code';
import { Diff } from '../../design-system/Diff';
import { Disclosure } from '../../design-system/Disclosure';
import { Fold } from '../../design-system/Fold';
import { plural } from '../../lib/plural';
import { when } from '../../lib/time';
import type { AuditEntry, AuditSubject } from './port';
import { ACTIONS } from './useAuditTrail';

function named(subject: AuditSubject): { name: string; kind: string | null } {
  if (subject.type === 'object') {
    return subject;
  }
  if (subject.type === 'schema') {
    return { name: 'Database schema', kind: `version ${subject.version}` };
  }
  const changes = subject.changes === null ? null : plural(subject.changes, 'change', 'changes');

  return { name: `Snapshot #${subject.to}`, kind: changes ?? (subject.from === null ? null : `from #${subject.from}`) };
}

function Body({ entry }: { entry: AuditEntry }) {
  const { subject, diff, document, raw } = entry;
  if (raw && document !== null) {
    return <Pre label="JSON">{document}</Pre>;
  }
  if (subject.type === 'snapshot') {
    return (
      <>
        <span className={subject.comment === null ? 'small faint' : 'small'}>{subject.comment ?? 'No comment'}</span>
        {subject.from !== null && <span className="small muted">{`Snapshot #${subject.from} → #${subject.to}`}</span>}
      </>
    );
  }

  return (
    <>
      {diff === null || diff.length === 0 ? <span className="small muted">No option changed</span> : <Diff lines={diff} />}
      {document !== null && (
        <Disclosure summary="Full document after this change">
          <Pre label="PHP">{document}</Pre>
        </Disclosure>
      )}
    </>
  );
}

export function AuditRow({ entry, open }: { entry: AuditEntry; open: boolean }) {
  const { name, kind } = named(entry.subject);
  const summary = (
    <>
      <span className="small muted audit-at">{when(entry.at)}</span>
      <span className="mono audit-who">{entry.identity}</span>
      <span className="audit-action">{ACTIONS[entry.action]}</span>
      <span className="row-name">{name}</span>
      {kind !== null && <span className="small faint">{kind}</span>}
    </>
  );

  return (
    <Fold summary={summary} defaultExpanded={open}>
      <Body entry={entry} />
    </Fold>
  );
}
