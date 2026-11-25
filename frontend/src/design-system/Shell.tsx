import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { MenuIcon } from './icons';

interface ShellProps {
  side: ReactNode;
  head: ReactNode;
  // The overlay sidebar closes whenever this changes, such as on each navigation.
  navKey?: string;
  children: ReactNode;
}

export function Shell({ side, head, navKey = '', children }: ShellProps) {
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === navKey;

  return (
    <div className="shell">
      <div id="nav" className={open ? 'shell-side is-open' : 'shell-side'}>
        {side}
      </div>
      <div className="shell-main">
        <header className="shell-head">
          <Button menu iconOnly label="Menu" controls="nav" expanded={open} onPress={() => setOpenAt(open ? null : navKey)}>
            <MenuIcon />
          </Button>
          {head}
        </header>
        {children}
      </div>
    </div>
  );
}
