import { Button } from '../../../design-system/Button';
import { Code } from '../../../design-system/Code';
import { SettingsForm, type Doc, type Issue } from '../../forms';
import { useEntitiesPort } from '../port';
import type { Mark } from './marks';

interface SettingsViewProps {
  doc: Doc;
  stored: Doc;
  marks: readonly Mark[];
  // The PHP of the document, as last translated.
  text: string;
  onChange: (doc: Doc) => void;
  onEdit: () => void;
}

function issuesOf(marks: readonly Mark[]): Issue[] {
  return marks.map(({ pointer, message, kind }) => ({ pointer: pointer ?? '', message, kind: kind === 'err' ? 'error' : 'warning' }));
}

// SPEC 10.10 on the edit screen, with the PHP nodes will load beside it.
export function SettingsView({ doc, stored, marks, text, onChange, onEdit }: SettingsViewProps) {
  const { form } = useEntitiesPort();

  return (
    <SettingsForm
      set="saml20-sp-remote"
      document={doc}
      saved={stored}
      onChange={onChange}
      issues={issuesOf(marks)}
      capabilities={form ?? {}}
      aside={
        <Code
          label="PHP"
          action={
            <>
              <Button variant="quiet" small onPress={onEdit}>
                Edit
              </Button>
              <Button variant="quiet" small onPress={() => void navigator.clipboard.writeText(text)}>
                Copy
              </Button>
            </>
          }
        >
          {text}
        </Code>
      }
    />
  );
}
