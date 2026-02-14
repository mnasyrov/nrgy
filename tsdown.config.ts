import { defineConfig } from 'tsdown';

export default defineConfig({
  workspace: ['packages/*'],
  entry: `./src/index.ts`,
  format: ['cjs', 'esm'],
  platform: 'neutral',
  target: 'es2020',
  dts: true,
  // exports: true,
});
