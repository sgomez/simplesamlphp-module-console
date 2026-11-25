import { Button } from '../../design-system/Button';
import { Callout } from '../../design-system/Callout';
import { Select } from '../../design-system/Select';
import { TextArea } from '../../design-system/TextArea';
import { TextLink } from '../../design-system/TextLink';
import { failureText } from '../../lib/failureText';
import { SET_WORDS } from '../entities';
import { formatLabels } from './detect';
import { addPath } from './port';
import { Problems } from './Problems';
import type { PastedFormat } from './types';
import type { Paste } from './usePaste';

interface PasteAreaProps {
  paste: Paste;
  label: string;
  // The formats the Detected select offers; with one, there is nothing to correct and no select.
  formats?: readonly PastedFormat[];
}

function OtherSet({ paste }: { paste: Paste }) {
  const { shown } = paste;
  if (shown?.kind !== 'other-set') {
    return null;
  }
  const { one } = SET_WORDS[shown.set];

  return (
    <Callout
      kind="warning"
      title={`This is ${/^[aeiou]/i.test(one) ? 'an' : 'a'} ${one}`}
      action={
        <Button variant="primary" small onPress={() => paste.carry(addPath(shown.set), shown)}>
          {`Add as ${one}`}
        </Button>
      }
    >
      <span className="mono wrap-any">{shown.entityId}</span>
    </Callout>
  );
}

function Mismatch({ paste }: { paste: Paste }) {
  const { shown } = paste;

  return shown?.kind === 'mismatch' ? (
    <Callout kind="error" title="The entity ID does not match">
      <span className="mono wrap-any">{shown.entityId}</span>
    </Callout>
  ) : null;
}

// SPEC 10.12: the text area, the format it was detected as, and Review, which reads it.
export function PasteArea({ paste, label, formats = ['xml', 'php'] }: PasteAreaProps) {
  const { text, shown, problems } = paste;
  const labels = formatLabels(text);
  const empty = text.trim() === '';

  return (
    <>
      {paste.failed !== null && <Callout kind="error" title={failureText('Not read', paste.failed)} />}
      {paste.tooLarge && (
        <Callout kind="error" title="Larger than 1 MiB">
          For federation aggregates, use metarefresh.
        </Callout>
      )}
      <OtherSet paste={paste} />
      <Mismatch paste={paste} />
      {problems?.kind === 'unreadable' ? (
        <Problems label={label} text={text} problems={problems.problems} stale={shown === null} onChange={paste.setText} />
      ) : (
        <TextArea label={label} placeholder={label} mono rows={12} value={text} onChange={paste.setText} />
      )}
      <div className="add-review">
        {!empty && formats.length > 1 && (
          <label className="add-detected">
            <span className="small muted">Detected</span>
            <Select
              value={labels[paste.format]}
              options={formats.map((format) => labels[format])}
              onChange={(picked) => paste.choose(formats.find((format) => labels[format] === picked) ?? paste.format)}
            />
          </label>
        )}
        {shown?.kind !== 'other-set' && (
          <Button variant="primary" disabled={empty || paste.tooLarge} loading={paste.reading} onPress={() => void paste.review()}>
            Review
          </Button>
        )}
      </div>
    </>
  );
}

export function CopyFromExternal({ to }: { to: string }) {
  return (
    <TextLink to={to} className="small add-link">
      Copy from External entities
    </TextLink>
  );
}
