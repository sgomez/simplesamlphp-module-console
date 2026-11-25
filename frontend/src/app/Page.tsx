import { createContext, useContext, type ReactNode } from 'react';
import type { EditedEntity, MigrationRun } from '../api/types';
import { cx } from '../components/ui/classes';

// A message the Console shows at the top of whatever page comes next, such as the outcome of Run migrations.
export const PageNotice = createContext<ReactNode>(null);

// A one-shot message: the outcome of Run migrations, a text such as "Deleted.", or the entity a create answered,
// which its edit screen shows as saved.
export type Said = MigrationRun | string | { created: EditedEntity };

// Hands the outcome of a POST to the screen that follows; call it just before moving there with replace.
export const ReportOutcome = createContext<(said: Said) => void>(() => undefined);

interface PageProps {
  // narrow: a state or failure page; publish: the width and spacing of the Publish boards.
  width?: 'wide' | 'narrow' | 'publish' | undefined;
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
