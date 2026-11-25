import { useState } from 'react';
import { SearchPick } from '../../design-system/SearchPick';
import type { FormSchema } from '../documents';
import type { Doc } from './engine/document';
import { findOptions } from './engine/finder';

interface FinderProps {
  schema: FormSchema;
  doc: Doc;
  // Adds the option when it is not set, then moves the focus to it.
  onPick: (name: string) => void;
}

// SPEC 10.10, Finder: every root option but `extra`, set or not; one that does not apply is disabled, with why.
export function Finder({ schema, doc, onPick }: FinderProps) {
  const [query, setQuery] = useState('');
  const items = findOptions(schema, doc, query).map(({ name, title, group, set, reason }) => ({
    id: name,
    label: title,
    detail: `${name} · ${group}${set ? ' · set' : ''}`,
    disabled: reason,
  }));

  return (
    <SearchPick
      label="Find an option by name or title"
      placeholder="Find an option"
      items={items}
      query={query}
      onQuery={setQuery}
      onPick={onPick}
      shortcut="/"
    />
  );
}
