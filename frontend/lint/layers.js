import boundaries from 'eslint-plugin-boundaries';

// A slice may import the slices listed, so no cycle can form.
const SLICES = {
  database: [],
  session: ['database'],
  documents: [],
  entities: ['session', 'documents'],
  publication: ['session', 'entities'],
  nodes: ['session'],
  audit: ['session'],
  overrides: ['session', 'entities'],
};

const types = (...names) => ({ element: { types: names } });
const entry = (slice) => ({ element: { type: 'slice', captured: { slice }, fileInternalPath: 'index.ts' } });

// The layers of SPEC 10.17 under `src`; the lint fixtures reuse it on their own tree.
export function layers(src) {
  return {
    files: [`${src}/**/*.{ts,tsx,js}`],
    plugins: { boundaries },
    settings: {
      'import/resolver': { typescript: { alwaysTryTypes: true } },
      'boundaries/include': [`${src}/**/*`],
      'boundaries/elements': [
        { type: 'lib', pattern: `${src}/lib` },
        { type: 'design-system', pattern: `${src}/design-system` },
        { type: 'slice', pattern: `${src}/domain/*`, capture: ['slice'] },
        { type: 'page', pattern: `${src}/pages` },
        // screens/ holds the pages not yet rebuilt in layers; it is app code until it is gone.
        { type: 'app', pattern: [`${src}/app`, `${src}/screens`] },
      ],
      'boundaries/files': [
        // The entry keeps its path: the PHP side names it.
        { pattern: `${src}/main.tsx`, category: 'entry' },
        { pattern: `${src}/**/*.{test,stories,visual}.{ts,tsx}`, category: 'spec' },
        { pattern: [`${src}/app/adapters/memory/**`, `${src}/app/test/**`], category: 'double' },
      ],
    },
    rules: {
      'boundaries/no-unknown-files': 'error',
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          policies: [
            { allow: { dependency: { relationship: { to: 'internal' } } } },
            { allow: { to: { origin: ['external', 'core'] } } },
            { from: types('design-system'), allow: { to: types('lib') } },
            ...Object.entries(SLICES).map(([slice, deps]) => ({
              from: { element: { type: 'slice', captured: { slice } } },
              allow: { to: [types('lib', 'design-system'), ...deps.map(entry)] },
            })),
            { from: types('page'), allow: { to: [types('lib', 'design-system'), entry('*')] } },
            { from: types('app'), allow: { to: [types('lib', 'design-system', 'page', 'app'), entry('*')] } },
            { from: { file: { categories: 'entry' } }, allow: { to: [types('lib', 'design-system', 'page', 'app'), entry('*')] } },
            { from: { file: { categories: 'spec' } }, allow: { to: { file: { categories: ['double', 'entry'] } } } },
            {
              from: { file: { categories: { noneOf: ['spec', 'double'] } } },
              disallow: { to: { file: { categories: ['spec', 'double'] } } },
            },
          ],
        },
      ],
    },
  };
}
