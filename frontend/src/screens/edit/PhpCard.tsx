import type { Ref } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { downloadText } from '../../components/ui/download';
import { Editor, type EditorHandle, type LineMark } from '../../components/ui/Editor';

interface PhpCardProps {
  value: string;
  marks: Readonly<Record<number, LineMark>>;
  editor: Ref<EditorHandle>;
  busy: boolean;
  onChange: (value: string) => void;
}

function download(text: string) {
  downloadText(text, 'saml20-sp-remote.php', 'application/x-php');
}

export function PhpCard({ value, marks, editor, busy, onChange }: PhpCardProps) {
  return (
    <Card list>
      <div className="ed-bar">
        <span className="small muted code-label">Literal values only. Comments are not kept.</span>
        <Button variant="quiet" small onClick={() => void navigator.clipboard.writeText(value)}>
          Copy
        </Button>
        <Button variant="quiet" small onClick={() => download(value)}>
          Download
        </Button>
      </div>
      <Editor ref={editor} label="PHP" value={value} marks={marks} busy={busy} onChange={onChange} />
    </Card>
  );
}
