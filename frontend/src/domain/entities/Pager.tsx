import { LinkButton } from '../../design-system/Button';
import { Wide, Narrow } from '../../design-system/Responsive';
import { listPath } from './routes';
import type { EntityPage, ListFilter } from './types';

const number = new Intl.NumberFormat('en');

export function Pager({ result, filter }: { result: EntityPage; filter: ListFilter }) {
  const { page, pages, perPage, total, query } = result;
  const first = number.format((page - 1) * perPage + 1);
  const last = number.format(Math.min(page * perPage, total));
  const range = `${first} to ${last} of ${number.format(total)}`;

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="small muted pager-total">
        <Wide>{`${range} ${total === 1 ? 'service provider' : 'service providers'}`}</Wide>
        <Narrow>{range}</Narrow>
      </span>
      {pages > 1 && (
        <>
          <LinkButton small disabled={page <= 1} to={listPath(query, filter, page - 1)}>
            Previous
          </LinkButton>
          <span className="small muted">
            <Wide>{`Page ${number.format(page)} of ${number.format(pages)}`}</Wide>
            <Narrow>{`${number.format(page)} of ${number.format(pages)}`}</Narrow>
          </span>
          <LinkButton small disabled={page >= pages} to={listPath(query, filter, page + 1)}>
            Next
          </LinkButton>
        </>
      )}
    </nav>
  );
}
