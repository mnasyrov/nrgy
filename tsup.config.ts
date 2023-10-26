import { defineConfig } from 'tsup';

import pkg from './package.json';

export default defineConfig({
  entry: [
    'src/core/index.ts',
    'src/mvc/index.ts',
    'src/rx-effects/index.ts',
    'src/rxjs/index.ts',
  ],
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  external: Object.keys(pkg.optionalDependencies),
});
