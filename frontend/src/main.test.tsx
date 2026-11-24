import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { consoleBase } from './api/client';
import { page, session, stubApi } from './test/api';

describe('the entry module', () => {
  it('finds the Console under the module path, wherever SimpleSAMLphp is installed', () => {
    expect(consoleBase('/simplesaml/module.php/console/entities/saml20-sp-remote')).toBe('/simplesaml/module.php/console');
    expect(consoleBase('/module.php/console')).toBe('/module.php/console');
    expect(consoleBase('/elsewhere')).toBe('');
  });

  it('mounts the Console under the module path and calls the API there', async () => {
    window.history.replaceState(null, '', '/simplesaml/module.php/console/');
    const fetch = stubApi({
      '/simplesaml/module.php/console/api/session': { body: session },
      '/simplesaml/module.php/console/api/entities/saml20-sp-remote': { body: page([]) },
    });

    await import('./main');

    await waitFor(() => expect(window.location.pathname).toBe('/simplesaml/module.php/console/entities/saml20-sp-remote'));
    expect(await screen.findByRole('heading', { name: 'Service providers' })).toBeDefined();
    expect(fetch).toHaveBeenCalledWith('/simplesaml/module.php/console/api/session', expect.anything());
    expect(document.body.firstElementChild?.tagName).toBe('DIV');
  });
});
