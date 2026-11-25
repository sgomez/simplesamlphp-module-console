import { useState } from 'react';
import type { DocumentSet } from '../../documents';
import type { FormCapabilities } from '../context';
import type { Doc } from '../engine/document';
import type { Issue } from '../engine/issues';
import { SettingsForm } from '../SettingsForm';

export interface EditingProps {
  set: DocumentSet;
  initial: Doc;
  saved?: Doc;
  issues?: Issue[];
  capabilities?: FormCapabilities;
}

// The form over a document it keeps, for stories.
export function Editing({ set, initial, ...rest }: EditingProps) {
  const [doc, setDoc] = useState(initial);

  return <SettingsForm set={set} document={doc} onChange={setDoc} {...rest} />;
}
