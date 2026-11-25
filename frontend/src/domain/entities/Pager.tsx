import { LinkButton } from '../../design-system/Button';
import { Wide, Narrow } from '../../design-system/Responsive';
import { listPath } from './routes';
import { SET_WORDS, type EntitySet } from './sets';
import type { EntityPage, ListFilter } from './types';

const number = new Intl.NumberFormat('en');

export function Pager({ result, set, filter }: { result: EntityPage; set: EntitySet; filter: ListFilter }) {
  const { page, pages, perPage, total, query } = result;
  const first = number.format((page - 1) * perPage + 1);
  const last = number.format(Math.min(page * perPage, total));
  const range = `${first} to ${last} of ${number.format(total)}`;
  const { one, many } = SET_WORDS[set];

  return (
    <nav className="pager" aria-label="Pagination">
      <span className="small muted pager-total">
        <Wide>{`${range} ${total === 1 ? one : many}`}</Wide>
        <Narrow>{range}</Narrow>
      </span>
      {pages > 1 && (
        <>
          <LinkButton small disabled={page <= 1} to={listPath(set, query, filter, page - 1)}>
            Previous
          </LinkButton>
          <span className="small muted">
            <Wide>{`Page ${number.format(page)} of ${number.format(pages)}`}</Wide>
            <Narrow>{`${number.format(page)} of ${number.format(pages)}`}</Narrow>
          </span>
          <LinkButton small disabled={page >= pages} to={listPath(set, query, filter, page + 1)}>
            Next
          </LinkButton>
        </>
      )}
    </nav>
  );
}
