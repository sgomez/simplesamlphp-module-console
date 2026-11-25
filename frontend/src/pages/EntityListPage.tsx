import { LinkButton } from '../design-system/Button';
import { PlusIcon } from '../design-system/icons';
import { Page } from '../design-system/Page';
import { Narrow, Wide } from '../design-system/Responsive';
import { Listing, ListToolbar, newRoute, SET_WORDS, useEntityList, type EntitySet } from '../domain/entities';
import { externalPath } from '../domain/overrides';
import { useSessionPort } from '../domain/session';

export function EntityListPage({ set }: { set: EntitySet }) {
  const list = useEntityList(set);
  const { title, add } = SET_WORDS[set];
  const external = useSessionPort().screens.includes('external');

  return (
    <Page>
      <div className="page-head">
        <div className="title-block">
          <div className="title">
            <h1 className="h1">{title}</h1>
            <span className="mono faint at-wide">{set}</span>
          </div>
        </div>
        <LinkButton variant="primary" to={newRoute(set)} label={add}>
          <PlusIcon />
          <Wide>{add}</Wide>
          <Narrow>Add</Narrow>
        </LinkButton>
      </div>
      {!list.empty && <ListToolbar list={list} />}
      <Listing list={list} {...(external ? { elsewhere: (q: string) => externalPath({ set, q }) } : {})} />
    </Page>
  );
}
