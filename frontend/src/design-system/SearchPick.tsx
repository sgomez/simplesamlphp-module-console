import { useEffect, useRef } from 'react';
import { ComboBox, Input, Label, ListBox, ListBoxItem, Popover, Text, type Key } from 'react-aria-components';

export interface Pick {
  id: string;
  label: string;
  detail: string;
  // Why it cannot be picked.
  disabled?: string | null;
}

interface SearchPickProps {
  label: string;
  placeholder: string;
  // The caller filters by the text typed.
  items: readonly Pick[];
  query: string;
  onQuery: (query: string) => void;
  onPick: (id: string) => void;
  // A key that moves the focus here from anywhere on the page outside a field.
  shortcut?: string;
}

const typing = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

// A search field whose matches open below it; picking one acts and clears the text.
export function SearchPick({ label, placeholder, items, query, onQuery, onPick, shortcut }: SearchPickProps) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shortcut === undefined) {
      return;
    }
    const focus = (event: KeyboardEvent) => {
      if (event.key === shortcut && !typing(event.target)) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    document.addEventListener('keydown', focus);

    return () => document.removeEventListener('keydown', focus);
  }, [shortcut]);

  const pick = (key: Key | null) => {
    if (key !== null) {
      onQuery('');
      onPick(String(key));
    }
  };

  return (
    <ComboBox
      className="search-pick"
      inputValue={query}
      onInputChange={onQuery}
      selectedKey={null}
      onSelectionChange={pick}
      menuTrigger="input"
      allowsEmptyCollection
      disabledKeys={items.filter((item) => item.disabled).map((item) => item.id)}
    >
      <Label className="sr-only">{label}</Label>
      <Input ref={input} className="input" placeholder={placeholder} />
      {shortcut && (
        <span className="kbd" aria-hidden="true">
          {shortcut}
        </span>
      )}
      <Popover className="card menu search-pick-list" placement="bottom start" offset={4}>
        <ListBox items={items} renderEmptyState={() => <span className="small muted search-pick-none">No option matches.</span>}>
          {(item) => (
            <ListBoxItem id={item.id} textValue={item.label} className="nav-item search-pick-item">
              <span>{item.label}</span>
              <Text slot="description" className="xs muted">
                {item.disabled ?? item.detail}
              </Text>
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
