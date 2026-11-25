import { describe, expect, it } from 'vitest';
import { consoleBase } from './client';

describe('consoleBase', () => {
  it('finds the Console under the module path, wherever SimpleSAMLphp is installed', () => {
    expect(consoleBase('/simplesaml/module.php/console/entities/saml20-sp-remote')).toBe('/simplesaml/module.php/console');
    expect(consoleBase('/module.php/console')).toBe('/module.php/console');
    expect(consoleBase('/elsewhere')).toBe('');
  });
});
