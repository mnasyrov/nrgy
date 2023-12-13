import { defineConfig } from 'tsup';

import pkg from './package.json';

export default defineConfig({
  entry: {
    core: 'src/core/_public.ts',
    mvc: 'src/core/mvc/_public.ts',
    react: 'src/react/_public.ts',
    'rx-effects': 'src/rx-effects/_public.ts',
    rxjs: 'src/rxjs/_public.ts',
    'rxjs-react': 'src/rxjs-react/_public.ts',
    store: 'src/store/_public.ts',
  },
  clean: true,
  dts: true,
  format: ['cjs', 'esm'],
  external: Object.keys(pkg.optionalDependencies),
});
