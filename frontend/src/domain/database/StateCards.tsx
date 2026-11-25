import { Pre } from '../../design-system/Code';
import { Disclosure } from '../../design-system/Disclosure';
import { Empty } from '../../design-system/Empty';
import { Facts } from '../../design-system/Facts';
import type { DatabaseRefusal } from './types';

const PACKAGE = 'sgomez/simplesamlphp-module-console';

const titles: Record<DatabaseRefusal['state'], string> = {
  Unreachable: 'Database unreachable',
  SqliteTooOld: 'SQLite too old',
  ConsoleOlder: 'Console older than the database',
  MigrationsPending: 'Database update',
};

export function stateCrumb(refusal: DatabaseRefusal): string {
  return titles[refusal.state];
}

export interface CardProps {
  refusal: DatabaseRefusal;
  // A callout sits above the card and takes the place of its offset.
  flush: boolean;
}

export function Unreachable({ refusal, flush }: CardProps) {
  return (
    <Empty
      state
      flush={flush}
      title="Database unreachable"
      text="The Console cannot reach its database. Nodes keep serving their local Snapshot."
    >
      {refusal.detail && (
        <Disclosure summary="Technical detail">
          <Pre label="Technical detail">{refusal.detail}</Pre>
        </Disclosure>
      )}
    </Empty>
  );
}

export function SqliteTooOld({ refusal, flush }: CardProps) {
  return (
    <Empty state flush={flush} title="SQLite too old">
      <Facts
        facts={[
          { term: 'Found', value: refusal.sqliteVersion, className: 'mono is-strong' },
          { term: 'Minimum', value: refusal.sqliteMinimum, className: 'mono' },
        ]}
      />
    </Empty>
  );
}

export function ConsoleOlder({ refusal, flush }: CardProps) {
  return (
    <Empty state flush={flush} title="Console older than the database">
      <Facts
        facts={[
          { term: 'This Console knows', value: `Schema ${refusal.known}` },
          { term: 'The database holds', value: `Schema ${refusal.highest}`, className: 'is-strong' },
        ]}
      />
      <p className="muted empty-text">
        Update <span className="mono">{PACKAGE}</span> on this node.
      </p>
    </Empty>
  );
}
