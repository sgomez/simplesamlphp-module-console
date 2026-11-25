import { Input } from '../../../design-system/Input';
import { Radios } from '../../../design-system/Radios';
import { Select } from '../../../design-system/Select';
import { Switch } from '../../../design-system/Switch';
import { TextArea } from '../../../design-system/TextArea';
import { useForm, useInvalid } from '../context';
import { acceptsSecret } from '../engine/issues';
import type { ControlProps } from './props';

const text = (value: unknown) => (typeof value === 'string' ? value : '');

// Completion for a string that accepts a Secret reference: the names in secrets_dir, never their contents.
function useSecretNames(props: ControlProps): string[] {
  const { secrets } = useForm().capabilities;

  return secrets !== undefined && acceptsSecret(props.node) ? secrets.map((name) => `%secret(${name})%`) : [];
}

export function TextControl(props: ControlProps) {
  const { node, value, pointer, label, placeholder, onChange } = props;
  const invalid = useInvalid(pointer);
  const secrets = useSecretNames(props);
  const examples = node.widget === 'suggest' ? (node.examples ?? []).map(String) : [];

  if (node.widget === 'textarea') {
    return <TextArea label={label} mono rows={4} value={text(value)} invalid={invalid} onChange={onChange} />;
  }

  return (
    <Input
      label={label}
      mono
      value={text(value)}
      invalid={invalid}
      suggestions={[...examples, ...secrets]}
      onChange={onChange}
      {...(placeholder ? { placeholder } : {})}
    />
  );
}

export function NumberControl({ value, pointer, label, placeholder, onChange }: ControlProps) {
  const invalid = useInvalid(pointer);

  return (
    <Input
      type="number"
      label={label}
      mono
      value={typeof value === 'number' ? String(value) : ''}
      invalid={invalid}
      onChange={(typed) => onChange(typed === '' ? null : Number(typed))}
      {...(placeholder ? { placeholder } : {})}
    />
  );
}

export function ChoiceControl({ node, value, pointer, label, onChange }: ControlProps) {
  const invalid = useInvalid(pointer);
  const options = (node.enum ?? []).map(String);
  if (node.widget === 'radio') {
    return (
      <Radios label={label} labelHidden value={text(value)} options={options.map((o) => ({ value: o, label: o }))} onChange={onChange} />
    );
  }

  return <Select label={label} value={text(value)} options={options} empty={!options.includes(text(value))} invalid={invalid} onChange={onChange} />;
}

export function AuthsourceControl(props: ControlProps) {
  const { value, pointer, label, onChange } = props;
  const invalid = useInvalid(pointer);
  const { authsources } = useForm().capabilities;
  if (authsources === undefined) {
    return <TextControl {...props} />;
  }

  return <Select label={label} value={text(value)} options={authsources} empty={!authsources.includes(text(value))} invalid={invalid} onChange={onChange} />;
}

export function SwitchControl({ value, label, onChange }: ControlProps) {
  return <Switch label={label} checked={value === true} onChange={onChange} />;
}
