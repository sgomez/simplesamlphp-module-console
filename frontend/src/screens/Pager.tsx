import type { EntityPage } from '../api/types';
import { plural } from '../app/counts';
import { SP_LIST } from '../app/paths';
import { LinkButton } from '../components/ui/Button';

function pageUrl(query: string, page: number): string {
  const search = new URLSearchParams(query === '' ? {} : { q: query });
  search.set('page', String(page));

  return `${SP_LIST}?${search}`;
}

export function Pager({ result }: { result: EntityPage }) {
  const { page, pages, perPage, total, query } = result;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="small muted pager-total">
        {`${first} to ${last} of ${plural(total, 'service provider', 'service providers')}`}
      </span>
      {pages > 1 && (
        <>
          <LinkButton small disabled={page <= 1} to={pageUrl(query, page - 1)}>
            Previous
          </LinkButton>
          <span className="small muted">{`Page ${page} of ${pages}`}</span>
          <LinkButton small disabled={page >= pages} to={pageUrl(query, page + 1)}>
            Next
          </LinkButton>
        </>
      )}
    </nav>
  );
}
