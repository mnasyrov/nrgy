import { defineConfig } from 'vitest/config';

const nrgyPackages = [
  'core',
  'ditox',
  'ditox-react',
  'react',
  'rx-effects',
  'rxjs',
];

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    alias: {
      ...getNrgyPackageAliases(nrgyPackages),
    },
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: ['index.ts', 'index.tsx'],
    },
  },
});

function getNrgyPackageAliases(packageNames: string[]): Record<string, string> {
  return Object.fromEntries(
    packageNames.map((name) => [
      `@nrgyjs/${name}`,
      new URL(`./packages/${name}/src/`, import.meta.url).pathname,
    ]),
  );
}
