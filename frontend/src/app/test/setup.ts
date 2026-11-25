import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';

// Page tests import the whole app; on a loaded machine the first render takes seconds.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
