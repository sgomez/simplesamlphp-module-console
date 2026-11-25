import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { Button } from './Button';
import { cx } from './classes';
import { ChevronDownIcon } from './icons';

export type MenuEntry = { label: string; danger?: boolean; separated?: boolean } & (
  | { href: string; onSelect?: never }
  | { onSelect: () => void; href?: never }
);

interface MenuProps {
  entries: readonly MenuEntry[];
  id?: string;
  // Floats below the MenuButton that discloses it.
  pop?: boolean;
}

// A plain list of links and buttons: there is no arrow-key model, so no menu roles.
export function Menu({ entries, id, pop }: MenuProps) {
  return (
    <div id={id} className={cx('card menu', pop ? 'menu-pop' : 'menu-card')}>
      {entries.map(({ label, href, onSelect, danger, separated }) => (
        <Fragment key={label}>
          {separated && <hr />}
          {onSelect ? (
            <button type="button" className={cx('nav-item', danger && 'is-danger')} onClick={onSelect}>
              {label}
            </button>
          ) : (
            <a className={cx('nav-item', danger && 'is-danger')} href={href}>
              {label}
            </a>
          )}
        </Fragment>
      ))}
    </div>
  );
}

// A disclosure button; the focus goes back to it when the menu closes on Escape or on a choice.
export function MenuButton({ label, entries }: { label: string; entries: readonly MenuEntry[] }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        button.current?.focus();
      }
    };
    const onPress = (event: PointerEvent) => !anchor.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPress);

    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPress);
    };
  }, [open]);

  const closing = entries.map((entry) =>
    entry.onSelect === undefined
      ? entry
      : {
          ...entry,
          onSelect: () => {
            setOpen(false);
            button.current?.focus();
            entry.onSelect();
          },
        },
  );

  return (
    <div className="menu-anchor" ref={anchor}>
      <Button ref={button} controls={id} expanded={open} onClick={() => setOpen(!open)}>
        {label}
        <ChevronDownIcon />
      </Button>
      {open && <Menu id={id} entries={closing} pop />}
    </div>
  );
}
