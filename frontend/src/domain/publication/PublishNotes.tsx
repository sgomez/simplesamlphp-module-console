import { Callout } from '../../design-system/Callout';
import { Disclosure } from '../../design-system/Disclosure';
import { WarningIcon } from '../../design-system/icons';
import { TextLink } from '../../design-system/TextLink';
import { plural } from '../../lib/plural';
import { editPath } from '../entities';
import type { Moved, PublicationProblem } from './types';

// Names its object as the change rows do: the name, or the entity ID when it has none.
function Note({ note }: { note: PublicationProblem }) {
  if (note.entityId === null) {
    return <>{note.message}</>;
  }

  return (
    <>
      <TextLink to={editPath(note.entityId)} inherit>
        {note.name ?? <span className="mono">{note.entityId}</span>}
      </TextLink>
      {`: ${note.message}`}
    </>
  );
}

export function Problems({ problems }: { problems: PublicationProblem[] }) {
  const title = `${plural(problems.length, 'problem', 'problems')} ${problems.length === 1 ? 'blocks' : 'block'} publishing`;

  const [only] = problems;
  if (problems.length === 1 && only !== undefined) {
    return (
      <Callout kind="error" title={title}>
        <Note note={only} />
      </Callout>
    );
  }

  return (
    <Callout
      kind="error"
      title={title}
      items={problems.map((problem, index) => (
        <Note key={index} note={problem} />
      ))}
    />
  );
}

export function Warnings({ warnings }: { warnings: PublicationProblem[] }) {
  return (
    <Disclosure card summary={plural(warnings.length, 'warning', 'warnings')}>
      {warnings.map((warning, index) => (
        <div key={index} className="msg-warning">
          <WarningIcon />
          <span>
            <Note note={warning} />
          </span>
        </div>
      ))}
    </Disclosure>
  );
}

export function MovedNotice({ moved: { last } }: { moved: Moved }) {
  return (
    <Callout kind="warning" title="The changes moved while this page was open">
      {`${last ? `${last.name} was saved again ${last.when}. ` : ''}This is the current list.`}
    </Callout>
  );
}
