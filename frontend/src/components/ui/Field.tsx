import type { ReactNode } from 'react';
import { ErrorIcon } from './icons';

interface FieldProps {
  id: string;
  label: string;
  help?: string;
  error?: string;
  children: ReactNode;
}

export function Field({ id, label, help, error, children }: FieldProps) {
  return (
    <div className="field">
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {children}
      {help && <span className="help">{help}</span>}
      {error && (
        <div className="msg-error" role="alert">
          <ErrorIcon />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
