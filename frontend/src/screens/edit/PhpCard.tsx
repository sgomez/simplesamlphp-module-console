import type { Ref } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Editor, type EditorHandle, type LineMark } from '../../components/ui/Editor';

interface PhpCardProps {
  value: string;
  marks: Readonly<Record<number, LineMark>>;
  editor: Ref<EditorHandle>;
  busy: boolean;
  onChange: (value: string) => void;
}

function download(text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/x-php' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'saml20-sp-remote.php';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
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
