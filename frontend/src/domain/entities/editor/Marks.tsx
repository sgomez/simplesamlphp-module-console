import { Card } from '../../../design-system/Card';
import { Row } from '../../../design-system/Row';
import { TextLink } from '../../../design-system/TextLink';
import { editPath } from '../routes';
import type { Mark } from './marks';

interface MarksProps {
  marks: readonly Mark[];
  onLine: (line: number) => void;
  // Puts the suggested option in place of the unknown one on its line.
  onSuggest: (line: number, from: string, to: string) => void;
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

function Suggestion({ mark, onSuggest }: { mark: Mark; onSuggest: MarksProps['onSuggest'] }) {
  const { line, option, suggestion } = mark;
  if (suggestion === undefined || line === null || option === null) {
    return null;
  }

  return (
    <>
      {' Did you mean '}
      <TextLink
        inherit
        className="mono"
        href={`#line-${line}`}
        onClick={(event) => {
          event.preventDefault();
          onSuggest(line, option, suggestion);
        }}
      >
        {suggestion}
      </TextLink>
      ?
    </>
  );
}

export function Marks({ marks, onLine, onSuggest }: MarksProps) {
  if (marks.length === 0) {
    return null;
  }

  return (
    <Card list as="ul" className="marks">
      {marks.map((mark, index) => (
        <Row key={index} plain as="li" className="mark-row">
          <At line={mark.line} onLine={onLine} />
          <span className={mark.kind === 'err' ? 'msg-error' : 'msg-warning'}>
            <span className="mark-label">{mark.kind === 'err' ? 'Error' : 'Warning'}</span>
            {mark.option !== null && <span className="mono">{mark.option}</span>}
            <span>
              {mark.message}
              <Suggestion mark={mark} onSuggest={onSuggest} />
              {mark.existing && (
                <>
                  {' '}
                  <TextLink to={editPath(mark.existing.entityId)}>
                    {`Open ${mark.existing.name ?? mark.existing.entityId}`}
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
