import type { FormEvent } from 'react';
import { LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Empty } from '../../design-system/Empty';
import { Input } from '../../design-system/Input';
import { Select } from '../../design-system/Select';
import { failureText } from '../../lib/failureText';
import { AuditRow } from './AuditRow';
import type { AuditAction, AuditPage } from './port';
import { ACTIONS, type AuditTrail as Trail } from './useAuditTrail';

const ANY = 'Any action';
const number = new Intl.NumberFormat('en');

function Filters({ trail }: { trail: Trail }) {
  const { query, filter } = trail;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    filter({ object: String(new FormData(event.currentTarget).get('object') ?? '') });
  };
  const byLabel = (label: string) => (Object.keys(ACTIONS) as AuditAction[]).find((action) => ACTIONS[action] === label) ?? '';

  return (
    <div className="toolbar">
      <form className="search" role="search" onSubmit={submit}>
        <Input key={query.object} name="object" type="search" defaultValue={query.object} label="Object" placeholder="Object" />
      </form>
      <Select
        label="Action"
        value={query.action === null ? ANY : ACTIONS[query.action]}
        options={[ANY, ...Object.values(ACTIONS)]}
        onChange={(label) => filter({ action: byLabel(label) })}
      />
      <Input type="date" label="From date" value={query.from} onChange={(from) => filter({ from })} />
      <Input type="date" label="To date" value={query.to} onChange={(to) => filter({ to })} />
    </div>
  );
}

function Pager({ result, pageTo }: { result: AuditPage; pageTo: Trail['pageTo'] }) {
  const { page, pages, perPage, total } = result;
  const first = number.format((page - 1) * perPage + 1);
  const last = number.format(Math.min(page * perPage, total));

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="small muted pager-total">{`${first} to ${last} of ${number.format(total)}`}</span>
      {pages > 1 && (
        <>
          <LinkButton small disabled={page <= 1} to={pageTo(page - 1)}>
            Previous
          </LinkButton>
          <span className="small muted">{`Page ${number.format(page)} of ${number.format(pages)}`}</span>
          <LinkButton small disabled={page >= pages} to={pageTo(page + 1)}>
            Next
          </LinkButton>
        </>
      )}
    </nav>
  );
}

function Entries({ trail }: { trail: Trail }) {
  const { answer, pageTo } = trail;
  if (answer.state === 'loading') {
    return null;
  }
  if (answer.state === 'failed') {
    return <Callout kind="error" title={failureText('Audit trail not loaded', answer.status)} />;
  }
  const result = answer.data;

  return (
    <>
      {result.anonymous && (
        <Callout
          kind="info"
          title={
            <>
              Every change is recorded as <span className="mono">admin</span>
            </>
          }
        >
          SimpleSAMLphp has one administrator identity.
        </Callout>
      )}
      {result.entries.length === 0 ? (
        <Empty title="No change matches the filters" />
      ) : (
        <>
          <Card list>
            {result.entries.map((entry) => (
              <AuditRow key={entry.id} entry={entry} open={entry.diff !== null && entry.diff.length > 0} />
            ))}
          </Card>
          <Pager result={result} pageTo={pageTo} />
        </>
      )}
    </>
  );
}

// SPEC 10.15, the Audit trail tab.
export function AuditTrail({ trail }: { trail: Trail }) {
  return (
    <>
      <Filters trail={trail} />
      <Entries trail={trail} />
    </>
  );
}
