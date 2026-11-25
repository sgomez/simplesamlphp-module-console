import type { FormNode } from '../../documents';

export interface ControlProps {
  node: FormNode;
  value: unknown;
  // JSON pointer of the value, which locates its errors.
  pointer: string;
  label: string;
  // Shown in an empty field of a row, where no label is.
  placeholder?: string | undefined;
  onChange: (value: unknown) => void;
}
