import { createContext, useContext, type ReactNode } from 'react';
import { cx } from './classes';

// A message the Console shows at the top of whatever page comes next, such as the outcome of Run migrations.
export const PageNotice = createContext<ReactNode>(null);

interface PageProps {
  // narrow: a state or failure page; publish: Publish ready to go; changes: Publish blocked or moved; slim: History and Nodes.
  width?: 'wide' | 'narrow' | 'publish' | 'changes' | 'slim' | 'compare' | 'add' | undefined;
  bar?: ReactNode;
  children: ReactNode;
}

// The content of a screen, and the bar that sticks below it.
export function Page({ width, bar, children }: PageProps) {
  const notice = useContext(PageNotice);

  return (
    <>
      <main className={cx('page', width && `page-${width}`)}>
        {notice}
        {children}
      </main>
      {bar}
    </>
  );
}
