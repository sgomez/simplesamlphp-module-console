import { useState } from 'react';
import { Button } from '../../../design-system/Button';
import { Chip } from '../../../design-system/Chip';
import { Input } from '../../../design-system/Input';
import { useForm, useInvalid } from '../context';
import { isSecretReference } from '../engine/issues';
import type { ControlProps } from './props';

// SPEC 7.3: a stored literal in a password field; a Secret reference is plain text, told apart by its chip.
export function SecretControl({ value, pointer, label, onChange }: ControlProps) {
  const invalid = useInvalid(pointer);
  const { reveal, secrets } = useForm().capabilities;
  const [shown, setShown] = useState(false);
  const typed = typeof value === 'string' ? value : '';
  const reference = isSecretReference(typed);
  const suggestions = (secrets ?? []).map((name) => `%secret(${name})%`);

  return (
    <div className="with-chip">
      <Input
        type={reference || shown ? 'text' : 'password'}
        label={label}
        mono
        value={typed}
        invalid={invalid}
        suggestions={suggestions}
        onChange={onChange}
      />
      {reference && <Chip>Secret reference</Chip>}
      {!reference && reveal && typed !== '' && (
        <Button variant="quiet" small onPress={() => setShown(!shown)}>
          {shown ? 'Hide' : 'Reveal'}
        </Button>
      )}
    </div>
  );
}
