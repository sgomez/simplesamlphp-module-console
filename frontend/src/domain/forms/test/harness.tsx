import { render, screen } from '@testing-library/react';
import { useState } from 'react';
import type { DocumentSet } from '../../documents';
import type { FormCapabilities } from '../context';
import type { Doc } from '../engine/document';
import type { Issue } from '../engine/issues';
import { SettingsForm } from '../SettingsForm';

interface Options {
  saved?: Doc;
  issues?: Issue[];
  capabilities?: FormCapabilities;
}

// The form over a document it keeps; current() is the document as the form last changed it.
export function renderForm(set: DocumentSet, initial: Doc, options: Options = {}) {
  const seen = { doc: initial };

  function Harness() {
    const [doc, setDoc] = useState(initial);

    return (
      <SettingsForm
        set={set}
        document={doc}
        onChange={(next) => {
          seen.doc = next;
          setDoc(next);
        }}
        {...options}
      />
    );
  }

  render(<Harness />);

  return { current: () => seen.doc };
}

export function option(name: string): HTMLElement {
  const row = document.getElementById(`o-${name}`);
  if (row === null) {
    throw new Error(`No option ${name} on screen`);
  }

  return row;
}

export function group(title: string): HTMLElement {
  return screen.getByRole('button', { name: new RegExp(`^${title}`) }).closest('.grp') as HTMLElement;
}
