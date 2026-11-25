import { useRef } from 'react';
import { Card } from '../../design-system/Card';
import { Editor, type EditorHandle, type LineMark } from '../../design-system/Editor';
import { Row } from '../../design-system/Row';
import { TextLink } from '../../design-system/TextLink';
import type { ReadProblem } from './types';

interface ProblemsProps {
  label: string;
  text: string;
  problems: readonly ReadProblem[];
  // The problems stand for an earlier text: their lines are no longer marked.
  stale: boolean;
  onChange: (text: string) => void;
}

// SPEC 9.6: input that cannot be read, its lines marked, in the editor where it is corrected.
export function Problems({ label, text, problems, stale, onChange }: ProblemsProps) {
  const editor = useRef<EditorHandle>(null);
  const marks: Record<number, LineMark> = {};
  for (const { line } of stale ? [] : problems) {
    if (line !== null) {
      marks[line] = 'err';
    }
  }

  return (
    <>
      {!stale && (
        <Card list as="ul" className="marks">
          {problems.map(({ line, message }, index) => (
            <Row key={index} plain as="li" className="mark-row">
              {line === null ? (
                <span className="mark-line" />
              ) : (
                <TextLink
                  className="mono mark-line"
                  href={`#line-${line}`}
                  onClick={(event) => {
                    event.preventDefault();
                    editor.current?.goToLine(line);
                  }}
                >
                  {`Line ${line}`}
                </TextLink>
              )}
              <span className="msg-error">
                <span className="mark-label">Error</span>
                <span>{message}</span>
              </span>
            </Row>
          ))}
        </Card>
      )}
      <Card list>
        <Editor ref={editor} label={label} value={text} marks={marks} onChange={onChange} />
      </Card>
    </>
  );
}
