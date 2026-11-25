import type { ReactNode } from 'react';
import { Card } from '../../design-system/Card';
import { Row } from '../../design-system/Row';
import type { PastedReport } from './types';

export interface ReportLine {
  key: string;
  name: ReactNode;
  note?: ReactNode;
}

interface ReportGroupProps {
  title: string;
  // The count the heading shows, when it is not the number of lines.
  count?: number;
  lines: readonly ReportLine[];
  warn?: boolean;
}

export function ReportGroup({ title, count, lines, warn }: ReportGroupProps) {
  return (
    <Card className={warn ? 'rep rep-warn' : 'rep'}>
      <div className="rep-head">
        <h2 className="h3">{title}</h2>
        <span className="small muted">{count ?? lines.length}</span>
      </div>
      {lines.map(({ key, name, note }) => (
        <Row key={key} plain className="rep-row">
          <span className="rep-name">{name}</span>
          {note !== undefined && <span className="small muted rep-note">{note}</span>}
        </Row>
      ))}
    </Card>
  );
}

const mono = (option: string) => <span className="mono">{option}</span>;

// SPEC 9.6: what reading converted, moved to `extra` and ignored; what needs the administrator first.
export function PastedReportGroups({ report }: { report: PastedReport }) {
  const noted = (lines: PastedReport['converted']) => lines.map(({ option, note }) => ({ key: option, name: mono(option), note }));
  const groups: [string, ReportLine[]][] = [
    ['Understood', report.understood.map((option) => ({ key: option, name: mono(option) }))],
    ['Converted', noted(report.converted)],
    ['Kept as extra', noted(report.extra)],
    ['Ignored', noted(report.ignored)],
  ];
  const needs = report.needs.map(({ option, note, severity }) => ({
    key: option,
    name: mono(option),
    note: <span className={severity === 'error' ? 'msg-error' : 'msg-warning'}>{note}</span>,
  }));

  return (
    <div className="rep-groups">
      {needs.length > 0 && <ReportGroup title="Needs you" lines={needs} warn />}
      {groups.map(([title, lines]) => lines.length > 0 && <ReportGroup key={title} title={title} lines={lines} />)}
    </div>
  );
}
