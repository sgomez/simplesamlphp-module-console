import type { Ref } from 'react';
import { Button } from '../../../design-system/Button';
import { Card } from '../../../design-system/Card';
import { downloadText } from '../../../design-system/download';
import { Editor, type EditorHandle, type LineMark } from '../../../design-system/Editor';

interface PhpCardProps {
  value: string;
  marks: Readonly<Record<number, LineMark>>;
  editor: Ref<EditorHandle>;
  busy: boolean;
  onChange: (value: string) => void;
}

export function downloadPhp(text: string) {
  downloadText(text, 'saml20-sp-remote.php', 'application/x-php');
}

export function PhpCard({ value, marks, editor, busy, onChange }: PhpCardProps) {
  return (
    <Card list>
      <div className="ed-bar">
        <span className="small muted code-label">Literal values only. Comments are not kept.</span>
        <Button variant="quiet" small onPress={() => void navigator.clipboard.writeText(value)}>
          Copy
        </Button>
        <Button variant="quiet" small onPress={() => downloadPhp(value)}>
          Download
        </Button>
      </div>
      <Editor ref={editor} label="PHP" value={value} marks={marks} busy={busy} onChange={onChange} />
    </Card>
  );
}
