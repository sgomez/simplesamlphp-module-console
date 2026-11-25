import { Callout } from '../../design-system/Callout';
import { failureText } from '../../lib/failureText';
import type { SaveTrouble } from './useSavePasted';

export function SaveTroubleCallout({ trouble }: { trouble: SaveTrouble | null }) {
  switch (trouble?.kind) {
    case undefined:
      return null;
    case 'failed':
      return <Callout kind="error" title={failureText('Not saved', trouble.status)} />;
    case 'race':
      return <Callout kind="error" title="Not saved: it was saved by someone else since it was read." />;
    case 'invalid':
      return <Callout kind="error" title="Not saved" items={trouble.errors} />;
  }
}

export function TitleBlock({ title, id }: { title: string; id: string | null }) {
  return (
    <div className="page-head">
      <div className="title-block">
        <h1 className="h1 wrap-any">{title}</h1>
        {id !== null && <span className="mono muted wrap-any">{id}</span>}
      </div>
    </div>
  );
}
