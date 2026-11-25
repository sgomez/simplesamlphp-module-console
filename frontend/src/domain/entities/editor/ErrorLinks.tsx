import type { ReactNode } from 'react';
import { TextLink } from '../../../design-system/TextLink';
import type { Mark } from './marks';

// SPEC 10.9: under the callout of the Settings view, every error, linked to its field.
export function errorLinks(marks: readonly Mark[]): ReactNode[] {
  return marks
    .filter(({ kind }) => kind === 'err')
    .map(({ option, message }) =>
      option === null ? (
        message
      ) : (
        <>
          <TextLink inherit href={`#o-${option}`}>
            <span className="mono">{option}</span>
          </TextLink>{' '}
          {message}
        </>
      ),
    );
}
