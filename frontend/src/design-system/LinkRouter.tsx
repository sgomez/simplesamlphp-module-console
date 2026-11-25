import type { ReactNode } from 'react';
import { RouterProvider } from 'react-aria-components';
import { useHref, useNavigate } from 'react-router';

export function LinkRouter({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={(to) => void navigate(to)} useHref={useHref}>
      {children}
    </RouterProvider>
  );
}
