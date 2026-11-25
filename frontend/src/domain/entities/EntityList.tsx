import type { FormEvent } from 'react';
import { LinkButton } from '../../design-system/Button';
import { Card } from '../../design-system/Card';
import { Empty } from '../../design-system/Empty';
import { Input } from '../../design-system/Input';
import { Segmented } from '../../design-system/Segmented';
import { EntityListRow } from './EntityListRow';
import { Pager } from './Pager';
import { listPath, SP_LIST } from './routes';
import type { EntityPage, ListCounts, ListFilter } from './types';
import type { EntityList } from './useEntityList';

const FILTER_LABELS: Record<ListFilter, string> = { all: 'All', 'not-live': 'Not live', warnings: 'With warnings' };

function Filter({ query, filter, counts }: { query: string; filter: ListFilter; counts: ListCounts }) {
  const segments = (Object.keys(FILTER_LABELS) as ListFilter[]).map((key) => ({
    key,
    label: FILTER_LABELS[key],
    count: counts[key],
    to: listPath(query, key),
  }));

  return <Segmented label="Filter" segments={segments} current={filter} />;
}

// The filter shows only where the server counts what each one matches.
export function ListToolbar({ list }: { list: EntityList }) {
  const { query, filter, answer, search } = list;
  const counts = answer.state === 'ready' ? answer.data.counts : undefined;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(String(new FormData(event.currentTarget).get('q') ?? ''));
  };

  return (
    <div className="toolbar">
      <form className="search" role="search" onSubmit={submit}>
        <Input key={query} name="q" type="search" defaultValue={query} label="Search service providers" placeholder="Search by name or entity ID" />
      </form>
      {counts && <Filter query={query} filter={filter} counts={counts} />}
    </div>
  );
}

function NoMatch({ result }: { result: EntityPage }) {
  return result.query === '' ? (
    <Empty title="No service provider matches the filter" actions={<LinkButton to={SP_LIST}>Show all</LinkButton>} />
  ) : (
    <Empty title={`No service provider matches “${result.query}”`} actions={<LinkButton to={SP_LIST}>Clear search</LinkButton>} />
  );
}

// No skeleton: DesignSystem keeps it for a URL fetch or a Publication. A failure is the Console's to show.
export function Listing({ list }: { list: EntityList }) {
  const { answer, empty, filter } = list;
  if (answer.state !== 'ready') {
    return null;
  }
  if (empty) {
    return <Empty title="No service providers yet" />;
  }
  if (answer.data.rows.length === 0) {
    return <NoMatch result={answer.data} />;
  }

  return (
    <>
      <Card list>
        {answer.data.rows.map((row) => (
          <EntityListRow key={row.entityId} row={row} />
        ))}
      </Card>
      <Pager result={answer.data} filter={filter} />
    </>
  );
}
