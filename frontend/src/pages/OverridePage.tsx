import { Page } from '../design-system/Page';
import { OverrideCompare, useComparison } from '../domain/overrides';

export function OverridePage() {
  const comparison = useComparison();

  return (
    <Page width="compare">
      <OverrideCompare comparison={comparison} />
    </Page>
  );
}
