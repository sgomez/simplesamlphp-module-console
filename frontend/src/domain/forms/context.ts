import { createContext, useContext } from 'react';
import { at, type Issue } from './engine/issues';

export interface CertificateFacts {
  subject: string;
  // ISO date.
  expires: string;
  // Days left, negative once expired.
  days: number;
}

// What the server serving the page offers the form; without it the plain control shows.
export interface FormCapabilities {
  // The reveal control of a sensitive literal.
  reveal?: boolean;
  // The ids of the managed and File authsources.
  authsources?: readonly string[];
  // The file names of the node's secrets_dir, for completion.
  secrets?: readonly string[];
  // The subject and expiry of a valid pasted certificate.
  describe?: (pem: string) => CertificateFacts | null;
  expiryWarningDays?: number;
}

export interface FormContextValue {
  issues: readonly Issue[];
  capabilities: FormCapabilities;
}

export const FormContext = createContext<FormContextValue>({ issues: [], capabilities: {} });

export function useForm(): FormContextValue {
  return useContext(FormContext);
}

export function useInvalid(pointer: string): boolean {
  return at(useForm().issues, pointer).some(({ kind }) => kind === 'error');
}
