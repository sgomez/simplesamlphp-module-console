import { Fragment, useEffect, useRef, useState } from 'react';
import { Button } from './Button';
import { cx } from './classes';
import { ChevronDownIcon } from './icons';

export type MenuEntry = { label: string; danger?: boolean; separated?: boolean } & (
  | { href: string; onSelect?: never }
  | { onSelect: () => void; href?: never }
);

interface MenuProps {
  label: string;
  entries: readonly MenuEntry[];
  // Floats below the MenuButton that opened it.
  pop?: boolean;
}

export function Menu({ label, entries, pop }: MenuProps) {
  return (
    <div className={cx('card menu', pop ? 'menu-pop' : 'menu-card')} role="menu" aria-label={label}>
      {entries.map(({ label: text, href, onSelect, danger, separated }) => (
        <Fragment key={text}>
          {separated && <hr />}
          <a
            className={cx('nav-item', danger && 'is-danger')}
            role="menuitem"
            href={href ?? '#'}
            onClick={
              onSelect &&
              ((event) => {
                event.preventDefault();
                onSelect();
              })
            }
          >
            {text}
          </a>
        </Fragment>
      ))}
    </div>
  );
}

export function MenuButton({ label, entries }: { label: string; entries: readonly MenuEntry[] }) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false);
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
            entry.onSelect();
          },
        },
  );

  return (
    <div className="menu-anchor" ref={anchor}>
      <Button popup expanded={open} onClick={() => setOpen(!open)}>
        {label}
        <ChevronDownIcon />
      </Button>
      {open && <Menu label={label} entries={closing} pop />}
    </div>
  );
}
