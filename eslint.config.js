import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { layers } from './frontend/lint/layers.js';

const NATIVE = 'button|input|select|textarea|dialog|a|dl|details|summary';

export default tseslint.config(
  { ignores: ['frontend/lint/fixtures/**', 'storybook-static/**', '.vitest/**', 'frontend/src/domain/documents/generated/**', 'public/**', 'vendor/**', 'coverage/**'] },
  {
    files: ['frontend/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}', '*.{js,ts}'],
    extends: [tseslint.configs.strict],
  },
  {
    files: ['frontend/**/*.{ts,tsx}'],
    extends: [react.configs.flat.recommended, react.configs.flat['jsx-runtime'], reactHooks.configs.flat.recommended],
    settings: { react: { version: '19.3' } },
    rules: {
      'react/no-danger': 'error',
      'react/forbid-component-props': ['error', { forbid: ['style'] }],
      'react/forbid-dom-props': ['error', { forbid: ['style'] }],
      'no-restricted-syntax': [
        'error',
        {
          selector: `JSXOpeningElement[name.name=/^(${NATIVE})$/]`,
          message: 'Render native form, dialog, link, list and disclosure elements through a primitive of design-system.',
        },
        {
          selector: `CallExpression[callee.name='createElement'][arguments.0.value=/^(${NATIVE})$/]`,
          message: 'Render native form, dialog, link, list and disclosure elements through a primitive of design-system.',
        },
        {
          selector: `CallExpression[callee.property.name='createElement'][arguments.0.value=/^(${NATIVE})$/]`,
          message: 'Render native form, dialog, link, list and disclosure elements through a primitive of design-system.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '\\.(css|scss|sass|less|styl)(\\?.*)?$',
              message: 'The stylesheet is linked by the page shell, never imported.',
            },
            {
              regex: '^(\\.\\./)+src/|\\.php$',
              message: 'The front end talks to the module through the API only.',
            },
            {
              regex: '(^|/)docs/spec/schemas/',
              message: 'Schemas reach the front end only through the generated validators and types.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['frontend/src/design-system/**/*.{ts,tsx}', 'frontend/lint/fixtures/layers/design-system/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
  layers('frontend/src'),
  layers('frontend/lint/fixtures/layers'),
);
