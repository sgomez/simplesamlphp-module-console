import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ErrorIcon } from '../../design-system/icons';
import { PageIndex } from '../../design-system/PageIndex';
import { forms, type DocumentSet } from '../documents';
import { FormContext, type FormCapabilities } from './context';
import type { Doc } from './engine/document';
import { groupErrors, type Issue } from './engine/issues';
import { groupsOf } from './engine/presence';
import { addOption, setOption, unsetOption } from './engine/values';
import { Finder } from './Finder';
import { Group } from './Group';
import { optionId } from './OptionRow';
import { useIssues } from './useIssues';

interface SettingsFormProps {
  set: DocumentSet;
  document: Doc;
  onChange: (document: Doc) => void;
  // What the server found: the validate route's cross-field rules, or a rejected save.
  issues?: readonly Issue[];
  // The document as stored, which marks the options edited since.
  saved?: Doc;
  capabilities?: FormCapabilities;
  // Under the index, such as the PHP of the document.
  aside?: ReactNode;
}

const groupId = (index: number) => `g-${index}`;

function focusOption(name: string) {
  document.getElementById(optionId(name))?.querySelector<HTMLElement>('.opt-body :is(input, select, textarea, button)')?.focus();
}

// SPEC 10.10: the form of the set or type, generated from its schema.
export function SettingsForm({ set, document: doc, onChange, issues = [], saved, capabilities = {}, aside }: SettingsFormProps) {
  const schema = forms[set];
  const groups = groupsOf(schema, doc);
  const all = useIssues(set, doc, issues);
  const [expanded, setExpanded] = useState(() => groups.map((group) => group.options.length > 0));
  const focus = useRef<string | null>(null);

  useEffect(() => {
    if (focus.current !== null) {
      focusOption(focus.current);
      focus.current = null;
    }
  });

  const open = (index: number, value: boolean) => setExpanded((now) => now.map((was, at) => (at === index ? value : was)));
  const add = (name: string) => {
    onChange(addOption(schema, doc, name));
    open(schema.groups.findIndex(({ properties }) => properties.includes(name)), true);
    focus.current = name;
  };
  const general = all.filter(({ pointer, kind }) => pointer === '' && kind === 'error');

  return (
    <FormContext value={{ issues: all, capabilities }}>
      <div className="cols">
        <div className="col-main">
          <Finder schema={schema} doc={doc} onPick={add} />
          {general.map(({ message }, index) => (
            <div key={index} className="msg-error">
              <ErrorIcon />
              <span>{message}</span>
            </div>
          ))}
          {groups.map((group, index) => (
            <Group
              key={group.title}
              id={groupId(index)}
              group={group}
              doc={doc}
              saved={saved}
              errors={groupErrors(group, all)}
              expanded={expanded[index] ?? false}
              onExpandedChange={(value) => open(index, value)}
              onChange={(name, value) => onChange(setOption(doc, name, value))}
              onAdd={add}
              onUnset={(name) => onChange(unsetOption(doc, name))}
            />
          ))}
        </div>
        <aside className="form-aside">
          <PageIndex
            title="On this page"
            label="Groups on this page"
            entries={groups.map((group, index) => {
              const errors = groupErrors(group, all);

              return {
                target: groupId(index),
                label: group.title,
                count: `${group.set} of ${group.total}`,
                ...(errors > 0 && { note: errors === 1 ? '1 error' : `${errors} errors` }),
              };
            })}
          />
          {aside}
        </aside>
      </div>
    </FormContext>
  );
}
