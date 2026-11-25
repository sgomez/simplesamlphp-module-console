import { useState } from 'react';
import { AddButton } from '../../design-system/AddButton';
import { Button } from '../../design-system/Button';
import { Collapsible } from '../../design-system/Collapsible';
import { same, type Doc } from './engine/document';
import type { GroupView } from './engine/presence';
import { OptionRow } from './OptionRow';

const FIRST_ADDS = 5;

interface GroupProps {
  id: string;
  group: GroupView;
  doc: Doc;
  saved: Doc | undefined;
  errors: number;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onChange: (name: string, value: unknown) => void;
  onAdd: (name: string) => void;
  onUnset: (name: string) => void;
}

// One `x-groups` entry: its set options, then an add button for each one that applies and is not set.
export function Group({ id, group, doc, saved, errors, expanded, onExpandedChange, onChange, onAdd, onUnset }: GroupProps) {
  const [more, setMore] = useState(false);
  const adds = more ? group.addable : group.addable.slice(0, FIRST_ADDS);
  const hidden = group.addable.length - adds.length;

  return (
    <Collapsible
      id={id}
      title={group.title}
      meta={`${group.set} of ${group.total} set`}
      errors={errors}
      expanded={expanded}
      onExpandedChange={onExpandedChange}
    >
      {group.options.map((option) => (
        <OptionRow
          key={option.name}
          option={option}
          value={doc[option.name]}
          edited={saved !== undefined && !same(doc[option.name], saved[option.name])}
          onChange={(value) => onChange(option.name, value)}
          onUnset={() => onUnset(option.name)}
        />
      ))}
      {adds.length > 0 && (
        <div className="opt-adds">
          <span className="small muted opt-adds-label">Add</span>
          {adds.map(({ name, node }) => (
            <AddButton key={name} title={node.title ?? name} onPress={() => onAdd(name)}>
              {name}
            </AddButton>
          ))}
          {hidden > 0 && (
            <Button variant="quiet" small onPress={() => setMore(true)}>
              {`and ${hidden} more`}
            </Button>
          )}
        </div>
      )}
    </Collapsible>
  );
}
