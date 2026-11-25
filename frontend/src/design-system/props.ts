// Props left undefined are not passed, so a context's value (a MenuTrigger's aria-expanded, a TextField's) is not overridden.
export function defined<T extends object>(props: T): Partial<T> {
  return Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined)) as Partial<T>;
}
