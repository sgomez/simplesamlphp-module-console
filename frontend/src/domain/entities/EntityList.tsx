import type { FormEvent } from 'react';
import { LinkButton } from '../../design-system/Button';
import { Card } from '../../design-system/Card';
import { Empty } from '../../design-system/Empty';
import { Input } from '../../design-system/Input';
import { LinkSegmented } from '../../design-system/Segmented';
import { EntityListRow } from './EntityListRow';
import { Pager } from './Pager';
import { listPath, listRoute } from './routes';
import { SET_WORDS, type EntitySet } from './sets';
import type { EntityPage, ListCounts, ListFilter } from './types';
import type { EntityList } from './useEntityList';

const FILTER_LABELS: Record<ListFilter, string> = { all: 'All', 'not-live': 'Not live', warnings: 'With warnings' };

function Filter({ list, counts }: { list: EntityList; counts: ListCounts }) {
  const segments = (Object.keys(FILTER_LABELS) as ListFilter[]).map((key) => ({
    key,
    label: FILTER_LABELS[key],
    count: counts[key],
    to: listPath(list.set, list.query, key),
  }));

  return <LinkSegmented label="Filter" segments={segments} current={list.filter} />;
}

export function ListToolbar({ list }: { list: EntityList }) {
  const { query, answer, search } = list;
  const counts = answer.state === 'ready' ? answer.data.counts : null;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(String(new FormData(event.currentTarget).get('q') ?? ''));
  };

  return (
    <div className="toolbar">
      <form className="search" role="search" onSubmit={submit}>
        <Input
          key={query}
          name="q"
          type="search"
          defaultValue={query}
          label={`Search ${SET_WORDS[list.set].many}`}
          placeholder="Search by name or entity ID"
        />
      </form>
      {counts && <Filter list={list} counts={counts} />}
    </div>
  );
}

// elsewhere: where the same search runs among External entities, when the Console serves them.
type Elsewhere = ((query: string) => string) | undefined;

function NoMatch({ set, result, elsewhere }: { set: EntitySet; result: EntityPage; elsewhere: Elsewhere }) {
  const { one } = SET_WORDS[set];
  if (result.query === '') {
    return <Empty title={`No ${one} matches the filter`} actions={<LinkButton to={listRoute(set)}>Show all</LinkButton>} />;
  }
  const actions = (
    <>
      <LinkButton to={listRoute(set)}>Clear search</LinkButton>
      {elsewhere && (
        <LinkButton variant="quiet" to={elsewhere(result.query)}>
          Search External entities
        </LinkButton>
      )}
    </>
  );

  return <Empty title={`No ${one} matches “${result.query}”`} actions={actions} />;
}

// No skeleton: DesignSystem keeps it for a URL fetch or a Publication. A failure is the Console's to show.
export function Listing({ list, elsewhere }: { list: EntityList; elsewhere?: Elsewhere }) {
  const { set, answer, empty, filter } = list;
  if (answer.state !== 'ready') {
    return null;
  }
  if (empty) {
    return <Empty title={`No ${SET_WORDS[set].many} yet`} />;
  }
  if (answer.data.rows.length === 0) {
    return <NoMatch set={set} result={answer.data} elsewhere={elsewhere} />;
  }

  return (
    <>
      <Card list>
        {answer.data.rows.map((row) => (
          <EntityListRow key={row.entityId} row={row} set={set} />
        ))}
      </Card>
      <Pager result={answer.data} set={set} filter={filter} />
    </>
  );
}
