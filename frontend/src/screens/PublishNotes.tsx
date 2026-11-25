import type { PublicationProblem } from '../api/types';
import { plural } from '../app/counts';
import { editPath } from '../app/paths';
import { Callout } from '../components/ui/Callout';
import { Disclosure } from '../components/ui/Disclosure';
import { WarningIcon } from '../components/ui/icons';
import { TextLink } from '../components/ui/TextLink';

function Note({ note }: { note: PublicationProblem }) {
  if (note.entityId === null) {
    return <>{note.message}</>;
  }

  return (
    <>
      <TextLink to={editPath(note.entityId)} inherit>
        <span className="mono">{note.entityId}</span>
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
