import type { ReactNode } from 'react';
import { colours, fonts, radii, shadows, typeScale, type Token } from './tokens';

function Swatch({ value }: { value: string | undefined }) {
  if (value === undefined) {
    return <td>same</td>;
  }

  return (
    <td>
      <svg width="40" height="24" aria-hidden="true">
        <rect x="0.5" y="0.5" width="39" height="23" rx="4" fill={value} stroke="currentColor" />
      </svg>{' '}
      <code>{value}</code>
    </td>
  );
}

function Table({ tokens, cell }: { tokens: Token[]; cell: (value: string | undefined) => ReactNode }) {
  return (
    <table>
      <thead>
        <tr>
          <th>Token</th>
          <th>Light</th>
          <th>Dark</th>
        </tr>
      </thead>
      <tbody>
        {tokens.map((token) => (
          <tr key={token.name}>
            <td>
              <code>{token.name}</code>
            </td>
            {cell(token.light)}
            {cell(token.dark)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const text = (value: string | undefined) => <td>{value === undefined ? 'same' : <code>{value}</code>}</td>;

export function Colours() {
  return <Table tokens={colours} cell={(value) => <Swatch value={value} />} />;
}

export function Shadows() {
  return <Table tokens={shadows} cell={text} />;
}

export function Fonts() {
  return <Table tokens={fonts} cell={text} />;
}

export function Radii() {
  return (
    <table>
      <tbody>
        {radii.map(({ name, light }) => (
          <tr key={name}>
            <td>
              <code>{name}</code>
            </td>
            <td>
              <svg width="48" height="32" aria-hidden="true">
                <rect x="1" y="1" width="46" height="30" rx={parseFloat(light)} fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>{' '}
              <code>{light}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function TypeScale() {
  return (
    <table>
      <tbody>
        {typeScale.map(({ className, rule }) => (
          <tr key={className}>
            <td>
              <code>.{className}</code>
            </td>
            <td>
              <span className={className}>Service providers</span>
            </td>
            <td>
              <code>{rule}</code>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
