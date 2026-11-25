import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { consoleUrl } from '../api/client';
import type { EntityPage } from '../api/types';
import type { ApiState } from '../app/useApi';
import { SP_LIST } from '../app/paths';
import { useApi } from '../app/useApi';
import { LinkButton } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Empty } from '../components/ui/Empty';
import { PlusIcon } from '../components/ui/icons';
import { Input } from '../components/ui/Input';
import { EntityListRow } from './EntityListRow';
import { Pager } from './Pager';

function Listing({ result }: { result: EntityPage }) {
  if (result.rows.length === 0) {
    return result.query === '' ? null : (
      <Empty
        title={`No service provider matches “${result.query}”`}
        actions={
          <LinkButton to={SP_LIST}>Clear search</LinkButton>
        }
      />
    );
  }

  return (
    <>
      <Card list>
        {result.rows.map((row) => (
          <EntityListRow key={row.entityId} row={row} editUrl={consoleUrl(`${SP_LIST}/edit`)} />
        ))}
      </Card>
      <Pager result={result} />
    </>
  );
}

// No skeleton: DesignSystem keeps it for a URL fetch or a Publication. useApi replaces the screen on 401, 403 and 404.
function Result({ answer }: { answer: ApiState<EntityPage> }) {
  switch (answer.state) {
    case 'ready':
      return <Listing result={answer.data} />;
    case 'loading':
    case 'failed':
      return null;
  }
}

export function ServiceProviders() {
  const [params, setParams] = useSearchParams();
  const query = params.get('q') ?? '';
  const search = new URLSearchParams();
  if (query !== '') {
    search.set('q', query);
  }
  const page = params.get('page');
  if (page !== null) {
    search.set('page', page);
  }
  const answer = useApi<EntityPage>(`${SP_LIST}${search.size > 0 ? `?${search}` : ''}`);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get('q') ?? '').trim();
    setParams(q === '' ? {} : { q });
  };

  return (
    <>
      <div className="page-head">
        <div className="title-block">
          <div className="title">
            <h1 className="h1">Service providers</h1>
            <span className="mono faint">saml20-sp-remote</span>
          </div>
        </div>
        <LinkButton variant="primary" href={consoleUrl(`${SP_LIST}/new`)}>
          <PlusIcon />
          Add
        </LinkButton>
      </div>
      <form className="toolbar" role="search" onSubmit={submit}>
        <label className="search">
          <span className="sr-only">Search service providers</span>
          <Input key={query} name="q" type="search" defaultValue={query} placeholder="Search by name or entity ID" />
        </label>
      </form>
      <Result answer={answer} />
    </>
  );
}
