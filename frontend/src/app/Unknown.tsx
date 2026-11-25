import { useLayoutEffect } from 'react';
import { useFailure } from './failure';

// A path that names no screen: Not found.
export function Unknown() {
  const fail = useFailure();
  useLayoutEffect(() => {
    fail(404);
  }, [fail]);

  return null;
}
