import { useLayoutEffect } from 'react';
import { useFailure } from './failure';

// A path the router does not know: Not found.
export function Unknown() {
  const fail = useFailure();
  useLayoutEffect(() => {
    fail(404);
  }, [fail]);

  return null;
}
