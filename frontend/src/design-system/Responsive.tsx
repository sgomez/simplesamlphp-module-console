import type { ReactNode } from 'react';

// Boards that differ in wording at phone width: both texts render, the stylesheet shows one.
export function Wide({ children }: { children: ReactNode }) {
  return <span className="at-wide">{children}</span>;
}

export function Narrow({ children }: { children: ReactNode }) {
  return <span className="at-narrow">{children}</span>;
}
