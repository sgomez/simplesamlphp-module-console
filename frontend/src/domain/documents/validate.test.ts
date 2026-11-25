import type { ErrorObject } from 'ajv/dist/2020';
import { describe, expect, it } from 'vitest';
import { report } from './messages';
import { validate } from './validate';

const ACS = [{ Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST', Location: 'https://sp.example.org/acs' }];
const KEY = { privatekey: 'idp.key', certificate: { source: 'file', file: 'idp.crt' } };

describe('validate', () => {
  it('finds nothing wrong in a valid document', () => {
    expect(validate('saml20-sp-remote', { AssertionConsumerService: ACS })).toEqual([]);
  });

  it('never writes a default into the document', () => {
    const document = { AssertionConsumerService: ACS };

    validate('saml20-sp-remote', document);

    expect(document).toEqual({ AssertionConsumerService: ACS });
  });

  it('validates the documents of authsource types too', () => {
    expect(validate('saml:SP', { entityID: 'https://myapp.example.org/' })).toEqual([
      { pointer: '/entityID', message: 'The data must not match schema' },
    ]);
  });

  it('names a number that is not an integer', () => {
    expect(validate('saml20-sp-remote', { AssertionConsumerService: ACS, ProxyCount: 1.5 })).toEqual([
      { pointer: '/ProxyCount', message: 'The data (number) must match the type: integer' },
    ]);
  });

  it('counts the properties of an object that needs some', () => {
    expect(validate('saml20-sp-remote', { AssertionConsumerService: ACS, UIInfo: {} })).toEqual([
      { pointer: '/UIInfo', message: 'Object must have at least 1 properties, 0 found' },
    ]);
  });

  it('rejects a repeated item of a list of unique items', () => {
    const SingleSignOnService = { Bindings: ['urn:oasis:names:tc:SAML:2.0:bindings:SOAP', 'urn:oasis:names:tc:SAML:2.0:bindings:SOAP'] };

    expect(validate('saml20-idp-hosted', { host: 'idp.example.org', auth: 'a', key: KEY, SingleSignOnService })).toEqual([
      { pointer: '/SingleSignOnService/Bindings', message: 'Array must have unique items' },
    ]);
  });

  it('accepts a date and time without a time zone, as the server does', () => {
    const RegistrationInfo = { authority: 'https://a.example.org', instant: '2026-11-24T10:15:00' };

    expect(validate('saml20-sp-remote', { AssertionConsumerService: ACS, RegistrationInfo })).toEqual([]);
  });
});

describe('the messages of the module', () => {
  const failure = (keyword: string, extra: Partial<ErrorObject> = {}): ErrorObject => ({
    keyword,
    instancePath: '/x',
    schemaPath: '#/x',
    params: {},
    ...extra,
  });

  it('give the pattern a pattern fails when the schema has no message for it', () => {
    expect(report([failure('pattern', { params: { pattern: '^a$' } })])).toEqual([
      { pointer: '/x', message: 'The string should match pattern: ^a$' },
    ]);
  });

  it('give a contains without its own message the generic text', () => {
    expect(report([failure('contains')])).toEqual([
      { pointer: '/x', message: 'At least one array item must match schema' },
    ]);
  });

  it('refuse a keyword they have no text for', () => {
    expect(() => report([failure('maxLength')])).toThrow('No message for the keyword maxLength');
  });
});
