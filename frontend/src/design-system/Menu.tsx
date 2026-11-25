import { Fragment, type ReactNode } from 'react';
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
interface MenuButtonProps {
  label: string;
  entries: readonly MenuEntry[];
  // A quiet icon button in place of the label, which then only names it.
  icon?: ReactNode;
}

export function MenuButton({ label, entries, icon }: MenuButtonProps) {
  const choose = (key: string | number) => {
    const entry = entries.find(({ label: text }) => text === key);
    requestAnimationFrame(() => requestAnimationFrame(() => entry?.onSelect()));
  };

  return (
    <MenuTrigger>
      {icon ? (
        <Button variant="quiet" iconOnly label={label}>
          {icon}
        </Button>
      ) : (
        <Button>
          {label}
          <ChevronDownIcon />
        </Button>
      )}
      <Popover placement={icon ? 'bottom start' : 'bottom end'} offset={4}>
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
