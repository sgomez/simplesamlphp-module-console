import { FileTrigger } from 'react-aria-components';
import { Button } from './Button';

// Reads one local file as text, in the browser; nothing is sent.
export function FileButton({ label, onText }: { label: string; onText: (text: string) => void }) {
  const read = (files: FileList | null) => {
    const file = files?.item(0);
    if (file) {
      void file.text().then(onText);
    }
  };

  return (
    <FileTrigger onSelect={read}>
      <Button>{label}</Button>
    </FileTrigger>
  );
}
