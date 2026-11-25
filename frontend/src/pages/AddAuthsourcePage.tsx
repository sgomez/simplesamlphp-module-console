import { Page } from '../design-system/Page';
import { AddAuthsource } from '../domain/authsources';

export function AddAuthsourcePage() {
  return (
    <Page width="narrow">
      <h1 className="h1">Add authsource</h1>
      <AddAuthsource />
    </Page>
  );
}
