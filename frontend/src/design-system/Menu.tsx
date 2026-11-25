import { Fragment } from 'react';
import { Menu as AriaMenu, MenuItem, MenuTrigger, Popover, Separator } from 'react-aria-components';
import { Button } from './Button';
import { cx } from './classes';
import { ChevronDownIcon } from './icons';

export interface MenuEntry {
  label: string;
  onSelect: () => void;
  danger?: boolean;
  separated?: boolean;
}

// React Aria hands the focus back to the button one frame after the menu closes; the entry acts in the frame after,
// so a dialog it opens returns the focus to the button.
export function MenuButton({ label, entries }: { label: string; entries: readonly MenuEntry[] }) {
  const choose = (key: string | number) => {
    const entry = entries.find(({ label: text }) => text === key);
    requestAnimationFrame(() => requestAnimationFrame(() => entry?.onSelect()));
  };

  return (
    <MenuTrigger>
      <Button>
        {label}
        <ChevronDownIcon />
      </Button>
      <Popover placement="bottom end" offset={4}>
        <AriaMenu className="card menu" onAction={choose}>
          {entries.map(({ label: text, danger, separated }) => (
            <Fragment key={text}>
              {separated && <Separator />}
              <MenuItem id={text} className={cx('nav-item', danger && 'is-danger')}>
                {text}
              </MenuItem>
            </Fragment>
          ))}
        </AriaMenu>
      </Popover>
    </MenuTrigger>
  );
}
