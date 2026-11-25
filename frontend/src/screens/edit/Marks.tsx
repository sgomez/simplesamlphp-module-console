import { Card } from '../../components/ui/Card';
import { Row } from '../../components/ui/Row';
import { TextLink } from '../../components/ui/TextLink';
import { editPath } from '../../app/paths';
import type { Mark } from './marks';

interface MarksProps {
  marks: readonly Mark[];
  onLine: (line: number) => void;
}

function At({ line, onLine }: { line: number | null; onLine: (line: number) => void }) {
  if (line === null) {
    return <span className="mark-line" />;
  }

  return (
    <TextLink
      className="mono mark-line"
      href={`#line-${line}`}
      onClick={(event) => {
        event.preventDefault();
        onLine(line);
      }}
    >
      {`Line ${line}`}
    </TextLink>
  );
}

export function Marks({ marks, onLine }: MarksProps) {
  if (marks.length === 0) {
    return null;
  }

  return (
    <Card list as="ul" className="marks">
      {marks.map(({ kind, line, option, message, existing }, index) => (
        <Row key={index} plain as="li" className="mark-row">
          <At line={line} onLine={onLine} />
          <span className={kind === 'err' ? 'msg-error' : 'msg-warning'}>
            <span className="mark-label">{kind === 'err' ? 'Error' : 'Warning'}</span>
            {option !== null && <span className="mono">{option}</span>}
            <span>
              {message}
              {existing && (
                <>
                  {' '}
                  <TextLink to={editPath(existing.entityId)}>
                    {`Open ${existing.name ?? existing.entityId}`}
                  </TextLink>
                </>
              )}
            </span>
          </span>
        </Row>
      ))}
    </Card>
  );
}
