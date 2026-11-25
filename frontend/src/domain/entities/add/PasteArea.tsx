import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../design-system/Button';
import { Callout } from '../../../design-system/Callout';
import { FileButton } from '../../../design-system/FileButton';
import { Page } from '../../../design-system/Page';
import { LinkSegmented } from '../../../design-system/Segmented';
import { Select } from '../../../design-system/Select';
import { TextArea } from '../../../design-system/TextArea';
import { TextLink } from '../../../design-system/TextLink';
import { failureText } from '../../../lib/failureText';
import type { Result } from '../../../lib/result';
import { useSettle } from '../../session';
import type { PastedFormat } from '../port';
import { EXTERNAL, SP_NEW } from '../routes';
import type { EditedEntity } from '../types';
import { ADD_TITLE } from '../editor/EntityEditor';
import { detectFormat, formatChoices } from './detect';

const LABEL = 'Metadata XML or PHP array';

export const SOURCES = [
  { key: 'paste', label: 'Paste', to: SP_NEW },
  { key: 'upload', label: 'Upload', to: `${SP_NEW}?source=upload` },
  { key: 'empty', label: 'Start empty', to: `${SP_NEW}?source=empty` },
] as const;

interface PasteAreaProps {
  source: 'paste' | 'upload';
  read: (text: string, format: PastedFormat) => Promise<Result<EditedEntity>>;
  onRead: (entity: EditedEntity) => void;
}

// SPEC 10.12: the configuration a new object starts from.
export function PasteArea({ source, read, onRead }: PasteAreaProps) {
  const settle = useSettle();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [chosen, setChosen] = useState<{ text: string; format: PastedFormat } | null>(null);
  const [reading, setReading] = useState(false);
  const [failed, setFailed] = useState<number | null>(null);
  const choices = formatChoices(text);
  const format = chosen?.text === text ? chosen.format : detectFormat(text);
  const formats = Object.keys(choices) as PastedFormat[];

  const review = async () => {
    setReading(true);
    setFailed(null);
    const result = await read(text, format);
    setReading(false);
    if (result.ok) {
      onRead(result.data);

      return;
    }
    settle(result, setFailed);
  };

  return (
    <Page width="add">
      <h1 className="h1">{ADD_TITLE}</h1>
      <LinkSegmented label="Source" segments={SOURCES} current={source} />
      {failed !== null && <Callout kind="error" title={failureText('Not read', failed)} />}
      {source === 'upload' ? (
        <div>
          <FileButton
            label="Choose file"
            onText={(content) => {
              setText(content);
              void navigate(SP_NEW);
            }}
          />
        </div>
      ) : (
        <>
          <TextArea label={LABEL} placeholder={LABEL} code rows={18} value={text} onChange={setText} />
          <div className="add-review">
            {text.trim() !== '' && (
              <label className="add-detected">
                <span className="small muted">Detected</span>
                <Select
                  value={choices[format]}
                  options={formats.map((key) => choices[key])}
                  onChange={(label) => setChosen({ text, format: label === choices.xml ? 'xml' : 'php' })}
                />
              </label>
            )}
            <Button variant="primary" disabled={text.trim() === ''} loading={reading} onPress={() => void review()}>
              Review
            </Button>
          </div>
        </>
      )}
      <TextLink to={EXTERNAL} className="small">
        Copy from External entities
      </TextLink>
    </Page>
  );
}
