import type { FormEvent } from 'react';
import { Button, LinkButton } from '../../design-system/Button';
import { Chip } from '../../design-system/Chip';
import { Empty } from '../../design-system/Empty';
import { Input } from '../../design-system/Input';
import { Select } from '../../design-system/Select';
import { SET_WORDS } from '../entities';
import { EXTERNAL_SETS, externalPath } from './external';
import { ExternalSourceSection } from './ExternalSource';
import { importPath } from './selection';
import type { ExternalList } from './useExternalList';

const number = new Intl.NumberFormat('en');

export function ExternalHead({ title, entityId }: { title: string; entityId?: string | undefined }) {
  return (
    <div className="page-head">
      <div className="title-block">
        <div className="title">
          <h1 className="h1 wrap-any">{title}</h1>
        </div>
        {entityId !== undefined && <span className="mono muted wrap-any">{entityId}</span>}
      </div>
      <Chip>Read-only</Chip>
    </div>
  );
}

function Toolbar({ list }: { list: ExternalList }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    list.search(String(new FormData(event.currentTarget).get('q') ?? ''));
  };
  const titles = EXTERNAL_SETS.map((set) => SET_WORDS[set].title);

  return (
    <div className="toolbar">
      <form className="search" role="search" onSubmit={submit}>
        <Input key={list.query} name="q" type="search" defaultValue={list.query} label="Search by name or entity ID" placeholder="Search by name or entity ID" />
      </form>
      <Select
        label="Set"
        value={SET_WORDS[list.set].title}
        options={titles}
        onChange={(title) => list.choose(EXTERNAL_SETS[titles.indexOf(title)] ?? list.set)}
      />
    </div>
  );
}

// SPEC 9.2 and 10.13: read-only, grouped by source, searched and paged on the server.
export function ExternalEntities({ list }: { list: ExternalList }) {
  const { answer, query, set } = list;
  const sources = answer.state === 'ready' ? answer.data.sources : [];
  const listed = sources.filter((source) => source.error !== null || source.total > 0);
  let content = <>{listed.map((source) => <ExternalSourceSection key={source.position} list={list} source={source} />)}</>;
  if (answer.state === 'ready' && listed.length === 0) {
    content =
      query === '' ? (
        <Empty title={`No External ${SET_WORDS[set].many}`} />
      ) : (
        <Empty title={`No external entity matches “${query}”`} actions={<LinkButton to={externalPath({ set })}>Clear search</LinkButton>} />
      );
  }

  return (
    <>
      <ExternalHead title="External entities" />
      <Toolbar list={list} />
      {content}
    </>
  );
}

// SPEC 9.5: the ticked entities go to the Import confirmation.
export function ImportBar({ list }: { list: ExternalList }) {
  if (list.count === 0) {
    return null;
  }
  const count = number.format(list.count);

  return (
    <div className="save-bar">
      <div className="save-state">
        <span className="is-strong">{`${count} selected`}</span>
      </div>
      <Button variant="quiet" onPress={list.clear}>
        Clear
      </Button>
      <LinkButton variant="primary" to={importPath(list.selection)}>{`Import ${count}`}</LinkButton>
    </div>
  );
}
