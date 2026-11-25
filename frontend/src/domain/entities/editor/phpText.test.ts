import { describe, expect, it } from 'vitest';
import { insertOption, optionLines, phpLiteral, replaceKey } from './phpText';
import { ago } from './Outcome';

const PHP = [
  "$metadata['https://sp.example.org'] = [",
  "    'name' => ['en' => 'Example'], // a 'comment' => 1",
  "    # 'hash' => 1,",
  "    /* 'block' => 1,",
  "       'more' => 2 */",
  "    'contacts' => [",
  "        ['emailAddress' => 'a\\'b@example.org'],",
  '    ],',
  '    "ForceAuthn" => true,',
  '];',
].join('\n');

const option = (name: string, type: string, more: object = {}) => ({ name, title: name, type, ...more });

describe('the PHP text of the editor', () => {
  it('finds the line of each root option, past strings and comments', () => {
    expect([...optionLines(PHP)]).toEqual([
      ['name', 2],
      ['contacts', 6],
      ['ForceAuthn', 9],
    ]);
  });

  it('writes values as PHP literals', () => {
    expect(phpLiteral("it's")).toBe("'it\\'s'");
    expect(phpLiteral([1, 'a'])).toBe("[1, 'a']");
    expect(phpLiteral({ en: 'x' })).toBe("['en' => 'x']");
    expect(phpLiteral(false)).toBe('false');
    expect(phpLiteral(null)).toBe('null');
  });

  it('inserts an option after the line of the cursor when it sits between root options', () => {
    const at = PHP.indexOf("    'name'");
    const { text, at: cursor } = insertOption(PHP, at, option('ProxyCount', 'integer'));
    const lines = text.split('\n');

    expect(lines[2]).toBe("    'ProxyCount' => 0,");
    expect(text.slice(0, cursor).endsWith("'ProxyCount' => 0,")).toBe(true);
  });

  it('inserts an option last when the cursor is inside a value or outside the array', () => {
    const inside = insertOption(PHP, PHP.indexOf('emailAddress'), option('scope', 'array'));
    const after = insertOption(PHP, PHP.length, option('sharedkey', 'string', { default: 'k' }));

    expect(inside.text.split('\n').at(-2)).toBe("    'scope' => [],");
    expect(after.text.split('\n').at(-2)).toBe("    'sharedkey' => 'k',");
  });

  it('inserts on the next line in an array never closed, and at the cursor outside any array', () => {
    expect(insertOption('[', 1, option('x', 'object')).text).toBe("[\n    'x' => [],");
    expect(insertOption('', 0, option('y', 'unknown')).text).toBe("    'y' => '',");
  });

  it('puts a suggested key in place of an unknown one, on its line only', () => {
    const text = "[\n    'sing.logout' => true,\n    'x' => 'sing.logout',\n];";

    expect(replaceKey(text, 2, 'sing.logout', 'sign.logout')).toBe("[\n    'sign.logout' => true,\n    'x' => 'sing.logout',\n];");
    expect(replaceKey(text, 3, 'sing.logout', 'sign.logout')).toBe(text);
    expect(replaceKey('a', 1, 'b', 'c')).toBe('a');
  });

  it('says how long ago another save happened', () => {
    const now = new Date('2026-11-25T12:00:00Z');
    const before = (minutes: number) => new Date(now.getTime() - minutes * 60000);

    expect(ago(before(0), now)).toBe('a moment ago');
    expect(ago(before(2), now)).toBe('2 minutes ago');
    expect(ago(before(120), now)).toBe('2 hours ago');
    expect(ago(before(2880), now)).toBe('2 days ago');
  });
});
