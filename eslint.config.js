import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const NATIVE = 'button|input|select|textarea|dialog';

export default tseslint.config(
  { ignores: ['frontend/lint/fixtures/**', 'public/**', 'vendor/**', 'coverage/**'] },
  {
    files: ['frontend/**/*.{ts,tsx}', '*.{js,ts}'],
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
          message: 'Render native form and dialog elements through a primitive of components/ui.',
        },
        {
          selector: `CallExpression[callee.name='createElement'][arguments.0.value=/^(${NATIVE})$/]`,
          message: 'Render native form and dialog elements through a primitive of components/ui.',
        },
        {
          selector: `CallExpression[callee.property.name='createElement'][arguments.0.value=/^(${NATIVE})$/]`,
          message: 'Render native form and dialog elements through a primitive of components/ui.',
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
    files: ['frontend/src/components/ui/**/*.{ts,tsx}'],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
