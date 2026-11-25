import { LinkButton } from '../design-system/Button';
import { PlusIcon } from '../design-system/icons';
import { Page } from '../design-system/Page';
import { Narrow, Wide } from '../design-system/Responsive';
import { Listing, ListToolbar, SP_NEW, useEntityList } from '../domain/entities';

export function ServiceProvidersPage() {
  const list = useEntityList();

  return (
    <Page>
      <div className="page-head">
        <div className="title-block">
          <div className="title">
            <h1 className="h1">Service providers</h1>
            <span className="mono faint at-wide">saml20-sp-remote</span>
          </div>
        </div>
        <LinkButton variant="primary" to={SP_NEW} label="Add service provider">
          <PlusIcon />
          <Wide>Add service provider</Wide>
          <Narrow>Add</Narrow>
        </LinkButton>
      </div>
      {!list.empty && <ListToolbar list={list} />}
      <Listing list={list} />
    </Page>
  );
}
