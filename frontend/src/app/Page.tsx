import { createContext, useContext, type ReactNode } from 'react';
import { cx } from '../components/ui/classes';

// A message the Console shows at the top of whatever page comes next, such as the outcome of Run migrations.
export const PageNotice = createContext<ReactNode>(null);

interface PageProps {
  wide?: boolean;
  // The width of a state or failure page.
  narrow?: boolean;
  bar?: ReactNode;
  children: ReactNode;
}

// The content of a screen, and the bar that sticks below it.
export function Page({ wide, narrow, bar, children }: PageProps) {
  const notice = useContext(PageNotice);

  return (
    <>
      <main className={cx('page', wide && 'page-wide', narrow && 'page-narrow')}>
        {notice}
        {children}
      </main>
      {bar}
    </>
  );
}
