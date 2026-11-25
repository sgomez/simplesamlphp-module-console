import { LinkButton } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Card } from '../../design-system/Card';
import { Check } from '../../design-system/Check';
import { Chip } from '../../design-system/Chip';
import { Eid } from '../../design-system/Eid';
import { ChevronIcon } from '../../design-system/icons';
import { Row } from '../../design-system/Row';
import { Status } from '../../design-system/Status';
import { onDay } from '../../lib/time';
import { externalEntityPath, externalPath, type ExternalRow, type ExternalSource } from './external';
import type { ExternalList } from './useExternalList';

const number = new Intl.NumberFormat('en');

function Entity({ row }: { row: ExternalRow }) {
  return (
    <>
      <div className="row-main">
        {row.name !== null && <span className="row-name">{row.name}</span>}
        <Eid id={row.entityId} />
      </div>
      {row.managed && (
        <div className="row-end-note">
          <Chip>Managed</Chip>
        </div>
      )}
      {row.expired !== null && (
        <div className="row-end-note">
          <Status tone="warn" mark="warning">{`Expired ${onDay(row.expired)}`}</Status>
        </div>
      )}
      <ChevronIcon />
    </>
  );
}

function Pager({ list, source }: { list: ExternalList; source: ExternalSource }) {
  const { position, page, pages, perPage, total } = source;
  const to = (at: number) => externalPath({ set: list.set, q: list.query, source: String(position), page: String(at) });
  const last = Math.min(page * perPage, total);

  return (
    <nav className="pager" aria-label={`Pages of ${source.heading}`}>
      <span className="small muted pager-total">{`${number.format((page - 1) * perPage + 1)} to ${number.format(last)} of ${number.format(total)}`}</span>
      <LinkButton small disabled={page <= 1} to={to(page - 1)}>
        Previous
      </LinkButton>
      <span className="small muted">{`Page ${number.format(page)} of ${number.format(pages)}`}</span>
      <LinkButton small disabled={page >= pages} to={to(page + 1)}>
        Next
      </LinkButton>
    </nav>
  );
}

function Rows({ list, source }: { list: ExternalList; source: ExternalSource }) {
  const ticked = list.ticked(source);
  const rows = source.rows.map((row) => {
    const to = externalEntityPath(list.set, row.entityId);
    if (!source.importable) {
      return (
        <Row key={row.entityId} wrap to={to}>
          <Entity row={row} />
        </Row>
      );
    }
    const box = (
      <Check
        label={`Select ${row.name ?? row.entityId}`}
        hideLabel
        disabled={row.managed || ticked.all}
        checked={!row.managed && (ticked.all || ticked.ids.includes(row.entityId))}
        onChange={(on) => list.tick(source, row.entityId, on)}
      />
    );

    return (
      <Row key={row.entityId} wrap to={to} pick={box}>
        <Entity row={row} />
      </Row>
    );
  });

  return (
    <Card list>
      {source.importable && (
        <Row plain className="row-all">
          <Check label={`Select all ${number.format(source.total)} in this source`} checked={ticked.all} onChange={(on) => list.tickAll(source, on)} />
        </Row>
      )}
      {rows}
    </Card>
  );
}

// SPEC 9.2: one source of metadata.sources, its entities of the set paged on their own.
export function ExternalSourceSection({ list, source }: { list: ExternalList; source: ExternalSource }) {
  const count = number.format(source.total);

  return (
    <section className="src">
      <div className="src-head">
        <h2 className="h2">{source.heading}</h2>
        <span className="mono muted wrap-any">{source.location}</span>
        {source.error === null && <span className="small muted src-count">{source.importable ? count : `${count} · copy one at a time`}</span>}
      </div>
      {source.error === null ? <Rows list={list} source={source} /> : (
        <Callout kind="error" title="Source unreadable">
          <span className="mono wrap-any">{source.error}</span>
        </Callout>
      )}
      {source.pages > 1 && <Pager list={list} source={source} />}
    </section>
  );
}
