import { defineConfig } from 'tsup';

import pkg from './package.json';

const entries = [
  // Core libs
  { entry: 'core', source: 'src/core' },
  { entry: 'mvc', source: 'src/core/mvc' },
  { entry: 'store', source: 'src/core/store' },

  // Extensions
  { entry: 'react', source: 'src/react' },
  { entry: 'rx-effects', source: 'src/rx-effects' },
  { entry: 'rxjs', source: 'src/rxjs' },
  { entry: 'rxjs-react', source: 'src/rxjs-react' },
];

export default defineConfig({
  entry: entries.reduce(
    (obj, { entry, source }) => ({ ...obj, [entry]: `${source}/_public.ts` }),
    {},
  ),
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  external: Object.keys(pkg.optionalDependencies),
});
