import { describe, expect, it } from 'vitest';
import { ago, onDay, when } from './time';

const NOW = '2026-11-25T12:00:00Z';
const before = (seconds: number) => new Date(Date.parse(NOW) - seconds * 1000).toISOString();

describe('times', () => {
  it('write a moment and a day as the boards do', () => {
    expect(when('2026-11-22T14:10:00')).toBe('22 Nov 2026, 14:10');
    expect(onDay('2026-11-21T08:30:00')).toBe('21 Nov 2026');
  });

  it.each([
    [0, '0 s ago'],
    [59, '59 s ago'],
    [60, '1 min ago'],
    [3599, '59 min ago'],
    [3600, '1 hour ago'],
    [3 * 3600, '3 hours ago'],
    [86400, '1 day ago'],
    [-5, '0 s ago'],
  ])('measure %i seconds as %s', (seconds, text) => {
    expect(ago(before(seconds), NOW)).toBe(text);
  });
});
