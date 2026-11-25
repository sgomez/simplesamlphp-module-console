import { describe, expect, it } from 'vitest';
import { formats } from './formats';
import { equal, ucs2length } from './runtime';

const dateTime = formats['date-time'];

describe('the date-time format, as opis reads it', () => {
  it.each(['2026-11-24T10:15:00Z', '2026-11-24T10:15:00', '2026-11-24t10:15:00.5+01:00', '2024-02-29T00:00:60Z'])(
    'accepts %s',
    (value) => {
      expect(dateTime(value)).toBe(true);
    },
  );

  it.each(['yesterday', '2026-11-24 10:15:00Z', '2026-02-29T00:00:00Z', '1900-02-29T00:00:00Z', '0000-01-01T00:00:00Z', '2026-04-31T00:00:00Z'])(
    'rejects %s',
    (value) => {
      expect(dateTime(value)).toBe(false);
    },
  );

  it('accepts the 29th of February of a year divisible by 400', () => {
    expect(dateTime('2000-02-29T00:00:00Z')).toBe(true);
  });
});

describe('the helpers of the compiled validators', () => {
  it('count characters, not UTF-16 units', () => {
    expect(ucs2length('a😀b')).toBe(3);
  });

  it('compare JSON values deeply', () => {
    expect(equal({ a: [1, { b: 'x' }] }, { a: [1, { b: 'x' }] })).toBe(true);
    expect(equal({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(equal({ a: 1 }, { b: 1 })).toBe(false);
    expect(equal([1], { 0: 1 })).toBe(false);
    expect(equal(1, '1')).toBe(false);
    expect(equal(null, {})).toBe(false);
  });
});
