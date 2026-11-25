import type { ReactNode } from 'react';
import { FieldError, Label, Text, TextField } from 'react-aria-components';
import { ErrorIcon } from './icons';
import { defined } from './props';

interface FieldProps {
  label: string;
  value?: string;
  help?: string;
  error?: string;
  optional?: boolean;
  onChange?: (value: string) => void;
  children: ReactNode;
}

export function Field({ label, value, help, error, optional, onChange, children }: FieldProps) {
  return (
    <TextField className="field" isInvalid={error !== undefined} validationBehavior="aria" {...defined({ value, onChange })}>
      <Label className="label">
        {label}
        {optional && (
          <>
            {' '}
            <span className="faint label-optional">(optional)</span>
          </>
        )}
      </Label>
      {children}
      {help && (
        <Text slot="description" className="help">
          {help}
        </Text>
      )}
      <FieldError elementType="div" className="msg-error">
        <ErrorIcon />
        <span role="alert">{error}</span>
      </FieldError>
    </TextField>
  );
}
